import { RouterProvider } from 'react-router-dom';
import { PreferencesProvider } from '../features/preferences/PreferencesContext.jsx';
import router from './router.jsx';

function App() {
  return (
    <PreferencesProvider>
      <RouterProvider router={router} />
    </PreferencesProvider>
  );
}

export default App;
