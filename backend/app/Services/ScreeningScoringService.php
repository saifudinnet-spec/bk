<?php

namespace App\Services;

use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\SystemSetting;

class ScreeningScoringService
{
    /**
     * Calculate scores, category breakdown, and crisis flag detection
     */
    public static function processSubmission(int $questionnaireId, array $answers): array
    {
        $questions = Question::with('options')
            ->where('questionnaire_id', $questionnaireId)
            ->get()
            ->keyBy('id');

        $totalScore = 0;
        $categoryAccumulator = [];
        $hasCrisisFlag = false;
        $isCrisisFlagEnabled = SystemSetting::get('crisis_flag_enabled', 'true') === 'true';

        $processedAnswers = [];

        foreach ($answers as $ans) {
            $questionId = $ans['question_id'] ?? null;
            if (!$questionId || !isset($questions[$questionId])) {
                continue;
            }

            $question = $questions[$questionId];
            $category = $question->category;

            if (!isset($categoryAccumulator[$category])) {
                $categoryAccumulator[$category] = [
                    'category' => $category,
                    'raw_score' => 0,
                    'max_possible' => 0,
                    'question_count' => 0,
                ];
            }

            $score = null;
            $optionId = $ans['option_id'] ?? null;
            $textAnswer = $ans['text_answer'] ?? null;

            if ($question->question_type === 'textarea') {
                // Open-ended question: no numerical score
                $processedAnswers[] = [
                    'question_id' => $questionId,
                    'option_id' => null,
                    'score' => null,
                    'text_answer' => $textAnswer,
                ];
                continue;
            }

            if ($optionId) {
                $option = $question->options->firstWhere('id', $optionId);
                if ($option) {
                    $raw = $option->score;
                    if ($question->reverse_score) {
                        $raw = 4 - $raw; // For 0-4 Likert
                    }
                    $score = $raw;
                    $totalScore += $score;

                    $categoryAccumulator[$category]['raw_score'] += $score;
                    $categoryAccumulator[$category]['max_possible'] += 4;
                    $categoryAccumulator[$category]['question_count'] += 1;

                    // Crisis flag detection: High score on flagged safety questions
                    if ($isCrisisFlagEnabled && $question->is_crisis_flag && $raw >= 2) {
                        $hasCrisisFlag = true;
                    }
                }
            }

            $processedAnswers[] = [
                'question_id' => $questionId,
                'option_id' => $optionId,
                'score' => $score,
                'text_answer' => null,
            ];
        }

        // Determine Level: Rendah, Sedang, Tinggi per category
        $categoryScores = [];
        foreach ($categoryAccumulator as $cat => $data) {
            $ratio = $data['max_possible'] > 0 ? ($data['raw_score'] / $data['max_possible']) : 0;
            $level = 'Rendah';
            if ($ratio >= 0.65) {
                $level = 'Tinggi';
            } elseif ($ratio >= 0.35) {
                $level = 'Sedang';
            }

            $categoryScores[] = [
                'category' => $cat,
                'score' => $data['raw_score'],
                'max_score' => $data['max_possible'],
                'percentage' => round($ratio * 100),
                'level' => $level, // 'Rendah', 'Sedang', 'Tinggi'
            ];
        }

        return [
            'total_score' => $totalScore,
            'category_scores' => $categoryScores,
            'has_crisis_flag' => $hasCrisisFlag,
            'answers' => $processedAnswers,
        ];
    }
}
