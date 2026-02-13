import React from 'react';
import FormFieldEditor from './FormFieldEditor';
import { RegistrationField } from '../../types';

interface CoreFieldEditorProps {
  field: RegistrationField;
  onUpdateField: (updates: Partial<RegistrationField>) => void;
}

const CoreFieldEditor: React.FC<CoreFieldEditorProps> = (props) => {
    return <FormFieldEditor {...props} />;
};

export default CoreFieldEditor;