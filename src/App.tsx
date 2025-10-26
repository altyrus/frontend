import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { KioskDashboard } from './components/KioskDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<KioskDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
