"use client";
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'prefer-not-to-say'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  if (status === "loading") {
    return <div className="loading">Loading...</div>;
  }

  if (session) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const result = await signIn('google', {
        callbackUrl: '/signup/complete',
        redirect: false
      });
      
      if (result?.error) {
        setError('Google sign-in failed. Please try again.');
      }
    } catch (error) {
      setError('An error occurred during sign-up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      setError('An error occurred while updating your profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="voluntree-auth-bg">
      <div className="voluntree-auth-gradient" />
      <div className="voluntree-auth-container signup-container">
        <h1 className="voluntree-title">Join Communaid</h1>
        <p className="voluntree-slogan">Complete your profile to get started</p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="voluntree-forms">
          <form className="voluntree-form" onSubmit={handleFormSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="prefer-not-to-say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="voluntree-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Complete Profile'}
            </button>
          </form>

          <div className="voluntree-divider">or</div>

          <button 
            onClick={handleGoogleSignup}
            className="voluntree-btn google-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing up...' : 'Sign up with Google'}
          </button>

          <div className="login-link">
            Already have an account? <a href="/">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
} 