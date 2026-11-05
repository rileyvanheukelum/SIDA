
import { useState, type FormEvent } from 'react'

import './CommissionRequest.css'

const API_URL = 'http://localhost:3000/api'

export function CommissionRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    const dueDate = formData.get('dueDate')?.toString().trim()

    const requestData = {
      title: formData.get('title')?.toString().trim(),
      description: formData.get('description')?.toString().trim(),
      requirements: formData.get('requirements')?.toString().trim() || undefined,
      contactName: formData.get('contactName')?.toString().trim(),
      email: formData.get('email')?.toString().trim(),
      category: formData.get('category')?.toString(),
      timeline: formData.get('timeline')?.toString().trim() || undefined,
      dueDate: dueDate || undefined,
    }

    setIsSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch(`${API_URL}/commissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (!response.ok) {
        const message = Array.isArray(result.message)
          ? result.message.join(' ')
          : result.message

        throw new Error(message || 'Unable to submit your request.')
      }

      setSuccess(true)
      form.reset()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while submitting your request.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="commission-page">

      {/* PAGE INTRODUCTION */}
      <header className="commission-header">
        <p className="commission-eyebrow type-body-2">
          WORK WITH SIDA
        </p>

        <h1 className="commission-title type-header">
          Request a commission
        </h1>

        <p className="commission-description type-body-2">
          Tell us what you need, when you need it, and what kind of creative
          work you are looking for. Club leadership will review the request
          and connect it with appropriate student artists.
        </p>
      </header>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div role="status" className="commission-success type-body-2">
          <h2 className="type-subheading-4">
            Request submitted successfully!
          </h2>
          <p>
            Thank you for reaching out. SIDA leadership will review your
            commission request.
          </p>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div role="alert" className="commission-error type-body-2">
          {error}
        </div>
      )}

      {/* COMMISSION FORM */}
      <form
        className="commission-form"
        onSubmit={handleSubmit}
      >
        <Field
          label="Project title"
          name="title"
          placeholder="e.g. Spring musical poster"
          required
        />

        <Field
          label="Project description"
          name="description"
          placeholder="Describe the project and intended audience..."
          textarea
          required
        />

        <Field
          label="Project requirements"
          name="requirements"
          placeholder="Dimensions, deliverables, brand guidelines, files, etc."
          textarea
        />

        <div className="commission-form-row">
          <Field
            label="Contact name"
            name="contactName"
            placeholder="Your name"
            required
          />

          <Field
            label="Contact email"
            name="email"
            placeholder="you@houghton.edu"
            type="email"
            required
          />
        </div>

        <div className="commission-form-row">
          <label className="commission-field">
            <span className="commission-label type-subheading-4">
              Work type
            </span>

            <select
              name="category"
              required
              className="commission-input type-body-2"
              defaultValue="Graphic Design"
            >
              <option>Graphic Design</option>
              <option>Illustration / Painting</option>
              <option>Motion Design</option>
              <option>Video Editing</option>
              <option>Filming</option>
              <option>Photography</option>
              <option>Web Design</option>
              <option>Other</option>
            </select>
          </label>

          <Field
            label="Due date"
            name="dueDate"
            type="date"
          />
        </div>

        <Field
          label="Timeline / additional deadlines"
          name="timeline"
          placeholder="Tell us about milestones, rehearsals, print deadlines, etc."
          textarea
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="commission-submit type-body-2"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

    </section>
  )
}

function Field({
  label,
  name,
  placeholder,
  textarea,
  type = 'text',
  required = false,
}: {
  label: string
  name: string
  placeholder?: string
  textarea?: boolean
  type?: string
  required?: boolean
}) {
  return (
    <label className="commission-field">
      <span className="commission-label type-subheading-4">
        {label}
      </span>

      {textarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          rows={5}
          required={required}
          className="commission-input commission-textarea type-body-2"
        />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          className="commission-input type-body-2"
        />
      )}
    </label>
  )
}