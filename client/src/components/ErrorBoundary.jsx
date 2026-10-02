import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 text-white shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h1 className="text-xl font-black">Ocurrió un error inesperado</h1>
                <p className="text-xs text-slate-400">El sistema evitó la pantalla en blanco para que puedas continuar.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto text-xs font-mono text-rose-300">
              {this.state.error && this.state.error.toString()}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Sistema</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
