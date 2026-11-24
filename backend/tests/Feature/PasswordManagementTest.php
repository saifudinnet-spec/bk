<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_change_own_password()
    {
        $user = User::factory()->create([
            'email' => 'admin@example.test',
            'password' => Hash::make('password123'),
            'role' => 'ADMIN',
        ]);

        $response = $this->actingAs($user)->putJson('/api/auth/change-password', [
            'current_password' => 'password123',
            'new_password' => 'newSecret999',
            'new_password_confirmation' => 'newSecret999',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Kata sandi berhasil diperbarui.',
            ]);

        $user->refresh();
        $this->assertTrue(Hash::check('newSecret999', $user->password));
    }

    public function test_change_password_fails_if_current_password_wrong()
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
        ]);

        $response = $this->actingAs($user)->putJson('/api/auth/change-password', [
            'current_password' => 'wrongpass',
            'new_password' => 'newSecret999',
            'new_password_confirmation' => 'newSecret999',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }

    public function test_admin_can_reset_another_user_password()
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $targetUser = User::factory()->create([
            'email' => 'counselor@example.com',
            'password' => Hash::make('oldpass123'),
        ]);

        $response = $this->actingAs($admin)->putJson("/api/admin/users/{$targetUser->id}/password", [
            'password' => 'superResetPass123',
        ]);

        $response->assertStatus(200);

        $targetUser->refresh();
        $this->assertTrue(Hash::check('superResetPass123', $targetUser->password));
    }

    public function test_non_admin_cannot_reset_other_user_password()
    {
        $student = User::factory()->create([
            'role' => 'STUDENT',
        ]);

        $targetUser = User::factory()->create();

        $response = $this->actingAs($student)->putJson("/api/admin/users/{$targetUser->id}/password", [
            'password' => 'hacked123',
        ]);

        $response->assertStatus(403);
    }
}
