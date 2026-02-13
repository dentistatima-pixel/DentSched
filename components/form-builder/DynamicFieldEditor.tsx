
import React from 'react';
import FormFieldEditor from './FormFieldEditor';
import { RegistrationField } from '../../types';

interface DynamicFieldEditorProps {
  field: RegistrationField;
  onUpdateField: (updates: Partial<RegistrationField>) => void;
}

const DynamicFieldEditor: React.FC<DynamicFieldEditorProps> = (props) => {
    return <FormFieldEditor {...props} />;
};

export default DynamicFieldEditor;
