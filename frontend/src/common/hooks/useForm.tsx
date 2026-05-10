import { ChangeEvent, FormEvent, ReactNode, useRef, useState } from 'react';
import { tw } from '../utils/tw';

export type FormErrors<T> = Partial<Record<keyof T, string>>;

type UseFormOptions<T> = {
  initialValues: T;
  validate: (values: T) => FormErrors<T>;
  // Walk order for "focus first invalid field" on submit-fail.
  // Defaults to insertion order of `initialValues`'s keys.
  fieldOrder?: (keyof T)[];
};

export type FieldBindings<V> = {
  value: V;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setValue: (value: V) => void;
  ref: (el: HTMLElement | null) => void;
  'aria-invalid': boolean;
  className: string;
};

type FieldProps<T extends object, K extends keyof T> = {
  name: K;
  label?: string;
  required?: boolean;
  className?: string;
  render: (bindings: FieldBindings<T[K]>) => ReactNode;
};

const inputClasses = (invalid: boolean) =>
  tw(
    'w-full rounded-sm border bg-white px-4 py-3 text-sm transition-colors outline-none',
    invalid
      ? 'border-error focus:border-error shadow-[0_0_0_1px_var(--error),0_0_0_1px_rgba(222,28,65,0.5)]'
      : 'border-background-alt focus:border-brand-primary'
  );

export const useForm = <T extends object>(options: UseFormOptions<T>) => {
  const [values, setValues] = useState<T>(options.initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const refs = useRef<Partial<Record<keyof T, HTMLElement | null>>>({});

  const setValue = <K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const registerRef = (key: keyof T) => (el: HTMLElement | null) => {
    refs.current[key] = el;
  };

  const submit =
    (onValid: (values: T) => void) => (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const errs = options.validate(values);
      const order = options.fieldOrder ?? (Object.keys(values) as (keyof T)[]);
      const firstInvalid = order.find((k) => errs[k]);
      if (firstInvalid) {
        setErrors(errs);
        const el = refs.current[firstInvalid];
        el?.focus();
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      setErrors({});
      onValid(values);
    };

  const reset = () => {
    setValues(options.initialValues);
    setErrors({});
  };

  // Field reads `stateRef.current` so its closure sees the latest
  // values/errors/setters without re-binding on each render. Paired with
  // the lazy useState init below, this gives Field a stable reference
  // (children keep focus/cursor state across re-renders) AND fresh state.
  const stateRef = useRef({ values, errors, setValue, registerRef });
  stateRef.current = { values, errors, setValue, registerRef };

  type FieldComponent = <K extends keyof T>(
    props: FieldProps<T, K>
  ) => ReactNode;

  const [Field] = useState<FieldComponent>(() => {
    const FieldImpl: FieldComponent = ({
      name,
      label,
      required,
      className,
      render,
    }) => {
      const s = stateRef.current;
      const error = s.errors[name];
      const invalid = !!error;
      type V = T[typeof name];

      const bindings: FieldBindings<V> = {
        value: s.values[name],
        onChange: (e) => s.setValue(name, e.target.value as V),
        setValue: (v) => s.setValue(name, v),
        ref: s.registerRef(name),
        'aria-invalid': invalid,
        className: inputClasses(invalid),
      };

      return (
        <div className={tw('flex flex-col gap-2', className)}>
          {label && (
            <label className='text-sm font-bold'>
              {label}
              {required && <span aria-hidden='true'> *</span>}
            </label>
          )}
          {render(bindings)}
          {error && <p className='text-error text-sm'>{error}</p>}
        </div>
      );
    };
    return FieldImpl;
  });

  return { values, errors, setValue, registerRef, submit, reset, Field };
};
