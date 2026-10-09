import { sendContactFormNotification, escapeHtml } from '../services/emailService.js';

export const handleContact = async (req, res) => {
  const { fullName, email, message } = req.body;

  if (!fullName || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Sanitize and constrain input lengths
  const safeName = fullName.trim().slice(0, 100);
  const safeEmail = email.trim().slice(0, 150);
  const safeMessage = message.trim().slice(0, 2000);

  try {
    const result = await sendContactFormNotification({
      fullName: safeName,
      email: safeEmail,
      message: safeMessage,
    });

    if (!result.success) {
      console.warn('Contact Form dispatch warning:', result.error);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Your message has been sent successfully! Our customer support team will get back to you shortly.' 
    });
  } catch (error) {
    console.error('Contact Form Error:', error);
    return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
};