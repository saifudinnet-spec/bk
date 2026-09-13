import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { ToastProvider } from './store/ToastContext';
import { CounselingFlowProvider } from './store/CounselingFlowContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CounselingFlowProvider>
            <AppRoutes />
          </CounselingFlowProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
