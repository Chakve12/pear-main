import { Component } from 'react'
import Button from './ui/Button'
import PearLogo from './ui/PearLogo'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: 'var(--bg-app)' }}
        >
          <div className="glass-card rounded-2xl p-8 max-w-md text-center">
            <PearLogo size="md" className="justify-center" />
            <h2 className="mt-6 text-xl font-semibold text-[var(--text-primary)]">
              რაღაც შეცდომა მოხდა
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {this.state.error?.message || 'მოულოდნელი შეცდომა'}
            </p>
            <Button
              className="mt-6"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/dashboard'
              }}
            >
              დაფაზე დაბრუნება
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
