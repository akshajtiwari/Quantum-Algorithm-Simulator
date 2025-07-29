import React, { useState, useEffect } from 'react';
import { CircuitBackup } from '../types/quantum';
import { Save, FolderOpen, Trash2, Clock, FileText, X } from 'lucide-react';

interface BackupManagerProps {
  onSave: (name: string, description?: string) => void;
  onLoad: (backupId: string) => void;
  onDelete: (backupId: string) => void;
  getBackups: () => CircuitBackup[];
  onClose: () => void;
  mode: 'save' | 'load';
}

export const BackupManager: React.FC<BackupManagerProps> = ({
  onSave,
  onLoad,
  onDelete,
  getBackups,
  onClose,
  mode
}) => {
  const [backups, setBackups] = useState<CircuitBackup[]>([]);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  useEffect(() => {
    setBackups(getBackups());
  }, [getBackups]);

  const handleSave = () => {
    if (saveName.trim()) {
      onSave(saveName.trim(), saveDescription.trim() || undefined);
      setBackups(getBackups());
      setSaveName('');
      setSaveDescription('');
      if (mode === 'save') {
        onClose();
      }
    }
  };

  const handleLoad = (backupId: string) => {
    onLoad(backupId);
    onClose();
  };

  const handleDelete = (backupId: string) => {
    onDelete(backupId);
    setBackups(getBackups());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {mode === 'save' ? (
              <Save className="w-6 h-6 text-blue-600" />
            ) : (
              <FolderOpen className="w-6 h-6 text-green-600" />
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {mode === 'save' ? 'Save Circuit Backup' : 'Load Circuit Backup'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {mode === 'save' && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">
                Create New Backup
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
                    Backup Name *
                  </label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Enter backup name..."
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="Describe this circuit backup..."
                    rows={3}
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    saveName.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Save Backup
                </button>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {mode === 'save' ? 'Existing Backups' : 'Available Backups'}
            </h3>
            
            {backups.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No backups found</p>
                <p className="text-sm">Create your first backup to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {backups
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((backup) => (
                    <div
                      key={backup.id}
                      className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {backup.name}
                          </h4>
                          
                          {backup.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {backup.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(backup.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FileText className="w-3 h-3" />
                              <span>{backup.circuit.gates.length} gates</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {mode === 'load' && (
                            <button
                              onClick={() => handleLoad(backup.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Load
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(backup.id)}
                            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete backup"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};