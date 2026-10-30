"use client";
import { useState, type FormEvent } from "react";
import { site } from "@/config/site";

const REASONS = ["Product questions", "Business partnerships", "Technical support", "General enquiries"];
type Errors = Partial<Record<"name" | "email" | "reason" | "message", string>>;

export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [checked, setChecked] = useState(false);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "").trim();
    const next: Errors = {};
    if (!value("name")) next.name = "Enter your name.";
    if (!value("email")) next.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email"))) next.email = "Enter a valid email address, like name@company.com.";
    if (!value("reason")) next.reason = "Choose a reason for your enquiry.";
    if (value("message").length < 10) next.message = "Enter a message of at least 10 characters.";
    setErrors(next);
    setChecked(Object.keys(next).length === 0);
    const first = Object.keys(next)[0];
    if (first) (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
  }

  const field = (name: keyof Errors) => ({
    id: name, name, "aria-invalid": errors[name] ? true : undefined, "aria-describedby": errors[name] ? `${name}-error` : undefined,
    onChange: () => setChecked(false),
  });
  const error = (name: keyof Errors) => errors[name] && <span id={`${name}-error`} className="err">{errors[name]}</span>;

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <p className="notice">This form isn&apos;t connected to a mail service yet, so it checks your entries but can&apos;t send them.</p>
      <label className="field" htmlFor="name">Name<input {...field("name")} autoComplete="name" />{error("name")}</label>
      <label className="field" htmlFor="email">Email<input {...field("email")} type="email" autoComplete="email" />{error("email")}</label>
      <label className="field" htmlFor="reason">Reason for enquiry
        <select {...field("reason")} defaultValue=""><option value="" disabled>Choose a reason</option>{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
        {error("reason")}
      </label>
      <label className="field" htmlFor="message">Message<textarea {...field("message")} rows={6} />{error("message")}</label>
      <div className="actions"><button type="submit" className="btn primary">Check message</button></div>
      {checked && (
        <p className="notice bad" role="alert">
          Your entries look fine, but your message was not sent.{" "}
          {site.contact.email ? <>Please email <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> instead.</> : "A contact address hasn't been published yet."}
        </p>
      )}
    </form>
  );
}
