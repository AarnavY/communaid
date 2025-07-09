"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignupComplete() {
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }

    // Pre-fill form with Google data if available
    if (session.user) {
      setFormData(prev => ({
        ...prev,
        firstName: session.user.name?.split(' ')[0] || '',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || ''
      }));
    }
    
    setIsLoading(false);
  }, [session, status, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const skipProfile = () => {
    router.push('/');
  };

  if (isLoading || status === 'loading') {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="voluntree-auth-bg">
      <div className="voluntree-auth-gradient" />
      <div className="voluntree-auth-container signup-container">
        <h1 className="voluntree-title">Complete Your Profile</h1>
        <p className="voluntree-slogan">Welcome to Communaid! Please complete your profile to get started.</p>
        
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
            onClick={skipProfile}
            className="voluntree-btn skip-btn"
            disabled={isSubmitting}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
} 