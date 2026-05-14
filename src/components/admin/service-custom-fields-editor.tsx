'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

export interface CustomField {
  id?: string;
  _tempId?: string;
  label: string;
  fieldType: 'TEXT' | 'NUMBER' | 'SELECT' | 'TEXTAREA';
  options?: string | null;
  isRequired: boolean;
  placeholder?: string | null;
  sortOrder: number;
}

interface ServiceCustomFieldsEditorProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

export function ServiceCustomFieldsEditor({ fields, onChange }: ServiceCustomFieldsEditorProps) {
  const addField = () => {
    onChange([
      ...fields,
      {
        _tempId: `tmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        label: '',
        fieldType: 'TEXT',
        isRequired: false,
        sortOrder: fields.length,
        placeholder: '',
      },
    ]);
  };

  const updateField = (index: number, patch: Partial<CustomField>) => {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const arr = [...fields];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    onChange(arr.map((f, i) => ({ ...f, sortOrder: i })));
  };

  return (
    <div className="border-t border-gray-100 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">自定义检测项</p>
        <Button variant="outline" size="sm" onClick={addField}>
          <Plus className="mr-1 h-3 w-3" /> 添加检测项
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-gray-400">暂无自定义检测项</p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div
              key={field.id || field._tempId || `field-${idx}`}
              className="rounded-xl border border-gray-200 p-3"
            >
              <div className="mb-2 grid grid-cols-2 gap-3">
                <Input
                  label="名称"
                  value={field.label}
                  onChange={(e) => updateField(idx, { label: e.target.value })}
                  placeholder="例如：样品颜色"
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">类型</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={field.fieldType}
                    onChange={(e) =>
                      updateField(idx, { fieldType: e.target.value as CustomField['fieldType'] })
                    }
                  >
                    <option value="TEXT">文本</option>
                    <option value="NUMBER">数字</option>
                    <option value="SELECT">下拉选择</option>
                    <option value="TEXTAREA">多行文本</option>
                  </select>
                </div>
                <Input
                  label="提示文字"
                  value={field.placeholder || ''}
                  onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                  placeholder="输入框占位提示"
                />
                {field.fieldType === 'SELECT' ? (
                  <Input
                    label="选项（用逗号分隔）"
                    value={field.options || ''}
                    onChange={(e) => updateField(idx, { options: e.target.value })}
                    placeholder="例如：红色,蓝色,绿色"
                  />
                ) : (
                  <div />
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={field.isRequired}
                    onChange={(e) => updateField(idx, { isRequired: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  必填
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={idx === 0}
                    onClick={() => moveField(idx, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={idx === fields.length - 1}
                    onClick={() => moveField(idx, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => removeField(idx)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
