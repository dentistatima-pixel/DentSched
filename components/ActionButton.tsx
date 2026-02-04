import React from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * @interface ActionButtonProps
 * @description Props for the primary action button component.
 */
interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * If true, the button will be in a loading state, showing a spinner and loading text.
   * @default false
   */
  isLoading: boolean;
  /**
   * The text to display when the button is in the loading state.
   * @default "Saving..."
   */
  loadingText?: string;
  /**
   * The content to display when the button is not loading.
   */
  children: React.ReactNode;
}

/**
 * STORYBOOK DOCUMENTATION:
 * 
 * storiesOf('Components/ActionButton', module)
 *   .add('Default', () => <ActionButton isLoading={false}>Submit Action</ActionButton>)
 *   .add('Loading', () => <ActionButton isLoading={true} loadingText="Processing...">Submit Action</ActionButton>)
 *   .add('Disabled', () => <ActionButton isLoading={false} disabled={true}>Submit Action</ActionButton>);
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  isLoading,
  loadingText = 'Saving...',
  children,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`px-12 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale ${props.className || ''}`}
    >
      {isLoading ? (
        <>
          <RotateCcw size={16} className="animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};