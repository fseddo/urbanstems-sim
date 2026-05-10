# Forms

The codebase has its own small form primitive — [`useForm<T>`](../../../frontend/src/common/hooks/useForm.tsx) — rather than reaching for a library. Two consumers today: [`<ReviewModal>`](../../../frontend/src/products/ReviewModal.tsx) (5 fields, mixed input shapes) and [`<CheckoutForm>`](../../../frontend/src/checkout/CheckoutForm.tsx) (1 field alongside Stripe-managed inputs). Use `useForm` for any new form with custom validation; reach for a library only if/when the codebase outgrows what's described here.

## Shape

```ts
const form = useForm<FormState>({
  initialValues,
  validate,    // (values) => Partial<Record<keyof FormState, string>>
  fieldOrder?, // optional walk order for "first invalid field" focus
});
```

Returns:
- **`values`**, **`errors`** — current state, both typed against `FormState`.
- **`setValue<K>(key, value: T[K])`** — type-safe key/value setter. Wrong key or wrong type for a key is a compile error.
- **`registerRef(key)`** — callback ref to attach to a focusable element; populates the internal ref store used for focus-on-error.
- **`submit(onValid)`** — builds the `FormEvent` handler. On invalid: sets all errors, walks `fieldOrder` (default: `Object.keys(values)`), focuses + scrolls into view the first invalid field's registered ref. On valid: clears errors and calls `onValid(values)`.
- **`reset()`** — restores `initialValues`, clears errors.
- **`Field`** — a stable component bound to this form; see below.

## `<form.Field>` — bound, typed, polymorphic

`useForm` returns a stable `Field` component (created once via lazy `useState` init; closes over a state-ref so it always reads current values without re-binding). Used via member-expression JSX:

```tsx
<form.Field
  name='headline'
  label='Add a headline'
  required
  render={({ setValue, ...props }) => (
    <input {...props} type='text' placeholder='Summarize…' />
  )}
/>
```

- **`name: keyof T`** — type-checked against the form shape. Typos are compile errors.
- **`label?`** — optional; omit when an outer section header already labels the input. The `<label>` element is conditionally rendered.
- **`className?`** — merged onto Field's wrapper div via `tw()`. Use to override the default `gap-2` (e.g. `gap-0.5` to tighten input/error spacing on a single-field section).
- **`render(bindings)`** — the consumer's input element, parameterized by typed bindings.

### Render-prop bindings

```ts
type FieldBindings<V> = {
  value: V;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setValue: (value: V) => void;
  ref: (el: HTMLElement | null) => void;
  'aria-invalid': boolean;
  className: string;
};
```

Two patterns at the call site:

```tsx
// Standard <input>/<textarea>: spread input-shaped props, drop value-based setValue.
render={({ setValue, ...props }) => <input {...props} type='text' />}

// Value-shaped components (e.g. <StarRatingInput>): use value/setValue/ref directly.
render={({ value, setValue, ref }) => (
  <StarRatingInput value={value} onChange={setValue} ref={ref} size={32} />
)}
```

The destructure-rest pattern is required for input spreading because `setValue` would otherwise become an HTML attribute and trigger React warnings.

The bindings' `className` includes Stripe-shaped error styling (`border-error` + soft outer halo) when the field is invalid. Override per-call via `tw(props.className, 'rounded-md py-3.5')` — twMerge resolves conflicts.

## Validation

The `validate` function returns a partial errors object keyed by field name. Validators don't throw; they enumerate errors:

```ts
const validate = (state: FormState): FormErrors<FormState> => {
  const errs: FormErrors<FormState> = {};
  if (!state.email.trim() || !isEmail(state.email))
    errs.email = 'A valid email address is required';
  // ...
  return errs;
};
```

**Submit flow:** `form.submit(onValid)` runs `validate(values)`; if any errors are returned, sets them and focuses + scrolls to the first invalid field per `fieldOrder` (default = key insertion order, which usually matches JSX order). If clean, calls `onValid(values)`.

**Shared check:** [`isEmail`](../../../frontend/src/common/utils/isEmail.ts) is the codebase's loose email-shape regex (`x@y.z`). Used by both forms; full RFC 5322 over-rejects real-world addresses, so we keep it as a typo guard and let the backend / mail-deliverability handle genuine validity downstream.

## Why this pattern works

- **Type-safety end-to-end.** `setValue('emial', '...')` fails compile. `<form.Field name='emial' ...>` fails compile. The render-prop bindings know `T[K]`, so a numeric field's `value` is `number`, a string field's is `string`.
- **No `form` prop threading.** `Field` is bound at the `useForm` call site via JSX member expression — `<form.Field …>`. No FormContext / Provider / `useContext` indirection.
- **Stable Field reference.** Lazy `useState` initialization creates Field once per `useForm` call. Form state changes trigger parent re-renders, propagating to Field, which reads fresh state via a `stateRef.current` pointer (not a stale closure). Field's children (inputs) keep their own state — focus, cursor position, IME composition — across every form interaction.
- **Polymorphism without `as` discriminator.** A single render prop covers `<input>`, `<textarea>`, and arbitrary value-based components like `<StarRatingInput>`. The two patterns coexist via the destructure-rest convention for spread vs. named-binding access for value-shaped components.

## When to reach for a library instead

`useForm<T>` is intentionally minimal. If a future form needs:
- Async validation
- Form arrays / dynamic field lists
- Cross-field validation that's stateful (e.g. confirm-password)
- Per-field touched / dirty tracking
- Validation schema co-location (zod/yup)

…that's the moment to evaluate `react-hook-form` or similar. For now the hand-rolled hook earns its keep across two consumers and is short enough to read in one sitting.
