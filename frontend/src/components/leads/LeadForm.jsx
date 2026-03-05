import { useState } from "react";
import { Save, X } from "lucide-react";

// ── Constants ─────────────────────────────────
const STATUS_OPTIONS = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

const SOURCE_OPTIONS = [
  "website",
  "referral",
  "social_media",
  "email_campaign",
  "cold_call",
  "other",
];

const PRIORITY_OPTIONS = [
  "low",
  "medium",
  "high",
];

const INITIAL_STATE = {
  name:         "",
  email:        "",
  phone:        "",
  company:      "",
  status:       "new",
  source:       "website",
  priority:     "medium",
  service:      "",
  budget:       "",
  message:      "",
  followUpDate: "",
};

// ── Helpers ───────────────────────────────────
const formatLabel = (str) =>
  str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const buildInitialState = (data) => {
  if (!data) return INITIAL_STATE;
  return {
    ...INITIAL_STATE,
    ...data,
    budget: data.budget ?? "",
    followUpDate: data.followUpDate
      ? new Date(data.followUpDate).toISOString().split("T")[0]
      : "",
  };
};

// ── Sub-components — DEFINED OUTSIDE LeadForm ─
// ⚠️ IMPORTANT: These must live outside the parent component.
// Defining components inside another component causes React to
// treat them as brand-new component types on every render,
// unmounting and remounting the DOM node (and losing focus)
// after every single keystroke.

const SectionHeading = ({ children }) => (
  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 pt-1">
    {children}
  </h3>
);

const FieldWrapper = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <span>⚠</span> {error}
      </p>
    )}
  </div>
);

const TextInput = ({ name, label, required, type, placeholder, value, onChange, error }) => (
  <FieldWrapper label={label} required={required} error={error}>
    <input
      id={`field-${name}`}
      type={type || "text"}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`input-field ${
        error ? "border-red-400 focus:ring-red-400 bg-red-50" : ""
      }`}
    />
  </FieldWrapper>
);

const SelectInput = ({ name, label, options, value, onChange, error }) => (
  <FieldWrapper label={label} error={error}>
    <select
      id={`field-${name}`}
      name={name}
      value={value}
      onChange={onChange}
      className={`input-field cursor-pointer ${
        error ? "border-red-400 focus:ring-red-400" : ""
      }`}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {formatLabel(opt)}
        </option>
      ))}
    </select>
  </FieldWrapper>
);

// ── Main Component ────────────────────────────
const LeadForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [form,   setForm]   = useState(() => buildInitialState(initialData));
  const [errors, setErrors] = useState({});

  // ── Validation ──────────────────────────────
  const validate = () => {
    const errs = {};

    if (!form.name.trim()) {
      errs.name = "Full name is required";
    } else if (form.name.trim().length > 100) {
      errs.name = "Name cannot exceed 100 characters";
    }

    if (!form.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (form.phone && form.phone.length > 20) {
      errs.phone = "Phone number cannot exceed 20 characters";
    }

    if (form.budget !== "" && form.budget !== undefined) {
      if (isNaN(Number(form.budget)) || Number(form.budget) < 0) {
        errs.budget = "Budget must be a positive number";
      }
    }

    if (form.message && form.message.length > 2000) {
      errs.message = "Message cannot exceed 2000 characters";
    }

    if (form.followUpDate) {
      const date = new Date(form.followUpDate);
      if (isNaN(date.getTime())) {
        errs.followUpDate = "Please enter a valid date";
      }
    }

    return errs;
  };

  // ── Handlers ────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstErrKey = Object.keys(errs)[0];
      document
        .getElementById(`field-${firstErrKey}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const payload = {
      ...form,
      name:         form.name.trim(),
      email:        form.email.trim().toLowerCase(),
      phone:        form.phone?.trim()   || undefined,
      company:      form.company?.trim() || undefined,
      service:      form.service?.trim() || undefined,
      message:      form.message?.trim() || undefined,
      budget:       form.budget !== "" ? Number(form.budget) : undefined,
      followUpDate: form.followUpDate    || undefined,
    };

    // Strip undefined keys
    Object.keys(payload).forEach(
      (k) => payload[k] === undefined && delete payload[k]
    );

    onSubmit(payload);
  };

  // ── Render ───────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* ── Section 1: Contact Information ── */}
      <div>
        <SectionHeading>Contact Information</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <TextInput
            name="name"
            label="Full Name"
            required
            placeholder="e.g. Jane Smith"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />

          <TextInput
            name="email"
            label="Email Address"
            required
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />

          <TextInput
            name="phone"
            label="Phone Number"
            type="number"
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
          />

          <TextInput
            name="company"
            label="Company / Organisation"
            placeholder="Acme Inc."
            value={form.company}
            onChange={handleChange}
            error={errors.company}
          />

        </div>
      </div>

      <hr className="border-slate-100" />

      {/* ── Section 2: Lead Classification ── */}
      <div>
        <SectionHeading>Lead Classification</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <SelectInput
            name="status"
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={handleChange}
            error={errors.status}
          />

          <SelectInput
            name="source"
            label="Lead Source"
            options={SOURCE_OPTIONS}
            value={form.source}
            onChange={handleChange}
            error={errors.source}
          />

          <SelectInput
            name="priority"
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={handleChange}
            error={errors.priority}
          />

        </div>
      </div>

      <hr className="border-slate-100" />

      {/* ── Section 3: Business Information ── */}
      <div>
        <SectionHeading>Business Information</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <TextInput
            name="service"
            label="Service / Interest"
            placeholder="e.g. Web Development, SEO..."
            value={form.service}
            onChange={handleChange}
            error={errors.service}
          />

          {/* Budget with $ prefix */}
          <FieldWrapper label="Budget (USD)" error={errors.budget}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">
                $
              </span>
              <input
                id="field-budget"
                type="number"
                name="budget"
                value={form.budget}
                onChange={handleChange}
                placeholder="5000"
                min="0"
                className={`input-field pl-7 ${
                  errors.budget
                    ? "border-red-400 focus:ring-red-400 bg-red-50"
                    : ""
                }`}
              />
            </div>
          </FieldWrapper>

          {/* Follow-up date */}
          <FieldWrapper label="Follow-up Date" error={errors.followUpDate}>
            <input
              id="field-followUpDate"
              type="date"
              name="followUpDate"
              value={form.followUpDate}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
              className={`input-field ${
                errors.followUpDate
                  ? "border-red-400 focus:ring-red-400 bg-red-50"
                  : ""
              }`}
            />
          </FieldWrapper>

        </div>

        {/* Message — full width */}
        <div className="mt-4">
          <FieldWrapper label="Message / Notes" error={errors.message}>
            <div className="relative">
              <textarea
                id="field-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={4}
                maxLength={2000}
                placeholder="Details from the inquiry form, or any additional context about this lead..."
                className={`input-field resize-none ${
                  errors.message
                    ? "border-red-400 focus:ring-red-400 bg-red-50"
                    : ""
                }`}
              />
              <span
                className={`absolute bottom-2 right-3 text-xs pointer-events-none ${
                  form.message.length > 1800 ? "text-red-400" : "text-slate-300"
                }`}
              >
                {form.message.length} / 2000
              </span>
            </div>
          </FieldWrapper>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary min-w-[130px] justify-center"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {initialData ? "Update Lead" : "Create Lead"}
            </>
          )}
        </button>
      </div>

    </form>
  );
};

export default LeadForm;