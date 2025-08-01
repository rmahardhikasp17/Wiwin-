import React from 'react';
import { Button } from './button';
import { Loader2 } from 'lucide-react';

interface FixedSaveButtonProps {
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isVisible?: boolean;
  saveText?: string;
  cancelText?: string;
  formId?: string;
  disabled?: boolean;
}

export const FixedSaveButton: React.FC<FixedSaveButtonProps> = ({
  onSave,
  onCancel,
  isLoading = false,
  isVisible = true,
  saveText = 'Simpan',
  cancelText = 'Batal',
  formId,
  disabled = false
}) => {
  if (!isVisible) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10 p-4"
      style={{
        paddingBottom: `max(1rem, env(safe-area-inset-bottom))`,
        height: `calc(5rem + env(safe-area-inset-bottom))`
      }}
    >
      <div className="max-w-md mx-auto flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-3 text-sm sm:text-base font-medium"
        >
          {cancelText}
        </Button>
        <Button
          type={formId ? "submit" : "button"}
          form={formId}
          onClick={formId ? undefined : onSave}
          disabled={disabled || isLoading}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 text-white py-3 hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm sm:text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            saveText
          )}
        </Button>
      </div>
    </div>
  );
};
