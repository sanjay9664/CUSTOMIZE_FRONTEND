import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Star, Send, CheckCircle2, Clock, 
  AlertCircle, Sparkles, Filter, FileText, UploadCloud, ThumbsUp, RefreshCw 
} from 'lucide-react';

const Feedback = () => {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [formData, setFormData] = useState({
    title: '',
    category: 'Bug Report',
    priority: 'Medium',
    rating: 5,
    description: '',
    email: '',
    attachmentName: ''
  });

  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('userData');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.email) {
          setFormData(prev => ({ ...prev, email: parsed.email }));
        }
      } catch (e) {}
    }

    const savedList = localStorage.getItem('scada_feedback_list');
    if (savedList) {
      try {
        setFeedbackList(JSON.parse(savedList));
      } catch (e) {
        setFeedbackList([]);
      }
    } else {
      // Default sample feedback items
      const sample = [
        {
          id: 'FB-9021',
          title: 'HVAC Temperature Sensor Delay',
          category: 'Bug Report',
          priority: 'High',
          rating: 4,
          description: 'The real-time graph for Chiller-2 takes about 5 seconds to update when switching tabs.',
          email: 'admin@bms.com',
          status: 'Under Review',
          date: new Date(Date.now() - 86400000 * 2).toLocaleDateString('en-GB')
        },
        {
          id: 'FB-8842',
          title: 'Add Export to Excel in Daily DPR',
          category: 'Feature Request',
          priority: 'Medium',
          rating: 5,
          description: 'Would love to have CSV/Excel export in addition to PDF report generation.',
          email: 'operator@bms.com',
          status: 'Resolved',
          date: new Date(Date.now() - 86400000 * 5).toLocaleDateString('en-GB')
        }
      ];
      setFeedbackList(sample);
      localStorage.setItem('scada_feedback_list', JSON.stringify(sample));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, attachmentName: e.target.files[0].name }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newFeedback = {
        id: `FB-${Math.floor(1000 + Math.random() * 9000)}`,
        title: formData.title,
        category: formData.category,
        priority: formData.priority,
        rating: formData.rating,
        description: formData.description,
        email: formData.email,
        attachmentName: formData.attachmentName,
        status: 'Submitted',
        date: new Date().toLocaleDateString('en-GB')
      };

      const updated = [newFeedback, ...feedbackList];
      setFeedbackList(updated);
      localStorage.setItem('scada_feedback_list', JSON.stringify(updated));

      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        attachmentName: ''
      }));

      setTimeout(() => {
        setSubmittedSuccess(false);
      }, 5000);
    }, 600);
  };

  const getCategoryBadgeStyle = (cat) => {
    if (cat === 'Bug Report') {
      return { backgroundColor: 'rgba(239, 68, 68, 0.25)', color: '#ff6b6b', border: '1px solid rgba(239, 68, 68, 0.5)' };
    }
    if (cat === 'Feature Request') {
      return { backgroundColor: 'rgba(56, 189, 248, 0.25)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.5)' };
    }
    return { backgroundColor: 'rgba(148, 163, 184, 0.25)', color: '#e2e8f0', border: '1px solid rgba(148, 163, 184, 0.5)' };
  };

  const getStatusBadgeStyle = (st) => {
    if (st === 'Resolved') {
      return { backgroundColor: 'rgba(16, 185, 129, 0.25)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.5)' };
    }
    if (st === 'Under Review') {
      return { backgroundColor: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.5)' };
    }
    return { backgroundColor: 'rgba(56, 189, 248, 0.25)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.5)' };
  };

  return (
    <div className="p-3 p-md-4 min-vh-100 text-white" style={{ background: 'linear-gradient(135deg, #070d19 0%, #0f172a 100%)' }}>
      <div className="container-fluid max-w-6xl">
        
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between pb-3 mb-4 gap-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <div className="d-flex align-items-center gap-3">
            <div 
              className="p-2.5 rounded-3 d-flex align-items-center justify-content-center"
              style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
            >
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="fw-bold mb-0 text-white">Help & Feedback Center</h3>
              <p className="mb-0 small" style={{ color: '#94a3b8' }}>Share your experience, report issues, or suggest new SCADA features</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="d-flex p-1 rounded-3" style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              className="btn btn-sm px-3 py-2 fw-semibold rounded-2 transition-all d-flex align-items-center gap-1.5"
              style={{
                backgroundColor: activeTab === 'new' ? '#0284c7' : 'transparent',
                color: activeTab === 'new' ? '#ffffff' : '#94a3b8',
                border: 'none'
              }}
              onClick={() => setActiveTab('new')}
            >
              <Send size={15} /> Submit Feedback
            </button>
            <button
              className="btn btn-sm px-3 py-2 fw-semibold rounded-2 transition-all d-flex align-items-center gap-1.5"
              style={{
                backgroundColor: activeTab === 'history' ? '#0284c7' : 'transparent',
                color: activeTab === 'history' ? '#ffffff' : '#94a3b8',
                border: 'none'
              }}
              onClick={() => setActiveTab('history')}
            >
              <Clock size={15} /> Feedback History ({feedbackList.length})
            </button>
          </div>
        </div>

        {/* Alert banner on success */}
        {submittedSuccess && (
          <div 
            className="p-3 rounded-3 d-flex align-items-center gap-3 mb-4 animate-fade-in"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#ffffff' }}
          >
            <CheckCircle2 size={24} style={{ color: '#34d399' }} className="flex-shrink-0" />
            <div>
              <h6 className="fw-bold mb-0.5 text-white">Feedback Submitted Successfully!</h6>
              <p className="small mb-0" style={{ color: '#cbd5e1' }}>Thank you for helping us improve the BMS SCADA Platform. Your feedback reference is stored in history.</p>
            </div>
          </div>
        )}

        {/* Content Body */}
        {activeTab === 'new' ? (
          <div className="row g-4">
            {/* Form Column */}
            <div className="col-lg-8">
              <div 
                className="p-4 rounded-4 shadow-lg"
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                <h5 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                  <Sparkles size={18} style={{ color: '#fbbf24' }} /> Provide System Feedback
                </h5>

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    
                    {/* Category Select */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold" style={{ color: '#cbd5e1' }}>Category</label>
                      <select 
                        name="category" 
                        value={formData.category} 
                        onChange={handleChange}
                        className="form-select rounded-3 py-2"
                        style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                      >
                        <option value="Bug Report">🐛 Bug Report</option>
                        <option value="Feature Request">💡 Feature Request</option>
                        <option value="System Performance">⚡ System Performance</option>
                        <option value="UI & UX Layout">🎨 UI & UX Layout</option>
                        <option value="General Feedback">💬 General Feedback</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold" style={{ color: '#cbd5e1' }}>Priority / Urgency</label>
                      <select 
                        name="priority" 
                        value={formData.priority} 
                        onChange={handleChange}
                        className="form-select rounded-3 py-2"
                        style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    {/* Rating */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold mb-1" style={{ color: '#cbd5e1' }}>Overall System Rating</label>
                      <div 
                        className="d-flex align-items-center gap-2 p-2.5 rounded-3"
                        style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className="btn btn-link p-1 text-decoration-none border-0"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                          >
                            <Star
                              size={22}
                              style={{ 
                                color: star <= (hoverRating || formData.rating) ? '#fbbf24' : '#475569',
                                fill: star <= (hoverRating || formData.rating) ? '#fbbf24' : 'none' 
                              }}
                            />
                          </button>
                        ))}
                        <span className="ms-2 small fw-bold" style={{ color: '#38bdf8' }}>
                          {formData.rating === 5 ? '5/5 Excellent' : formData.rating === 4 ? '4/5 Good' : formData.rating === 3 ? '3/5 Average' : formData.rating === 2 ? '2/5 Needs Work' : '1/5 Poor'}
                        </span>
                      </div>
                    </div>

                    {/* Subject Title */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold" style={{ color: '#cbd5e1' }}>
                        Subject / Short Summary <span style={{ color: '#f87171' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        required
                        placeholder="e.g. Pump status graph not loading on mobile..."
                        value={formData.title}
                        onChange={handleChange}
                        className="form-control rounded-3 py-2"
                        style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                      />
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold" style={{ color: '#cbd5e1' }}>
                        Detailed Feedback / Issue Steps <span style={{ color: '#f87171' }}>*</span>
                      </label>
                      <textarea
                        name="description"
                        rows={4}
                        required
                        placeholder="Please describe what happened, expected behavior, or your suggestions..."
                        value={formData.description}
                        onChange={handleChange}
                        className="form-control rounded-3"
                        style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                      />
                    </div>

                    {/* Email Contact */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold" style={{ color: '#cbd5e1' }}>Contact Email</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="your-email@domain.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-control rounded-3 py-2"
                        style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                      />
                    </div>

                    {/* Attachment Upload */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold" style={{ color: '#cbd5e1' }}>Attachment (Optional screenshot)</label>
                      <div className="position-relative">
                        <input
                          type="file"
                          accept="image/*,.pdf,.log"
                          id="file-upload"
                          className="d-none"
                          onChange={handleFileChange}
                        />
                        <label
                          htmlFor="file-upload"
                          className="btn w-100 d-flex align-items-center justify-content-center gap-2 rounded-3 text-truncate py-2"
                          style={{ backgroundColor: '#0f172a', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                        >
                          <UploadCloud size={18} style={{ color: '#38bdf8' }} />
                          <span className="text-truncate">
                            {formData.attachmentName || 'Choose image/log file'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="col-12 mt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-lg w-100 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow"
                        style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none' }}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw size={20} className="spinner-border spinner-border-sm" /> Submitting...
                          </>
                        ) : (
                          <>
                            <Send size={20} /> Submit Feedback
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar Guidelines Column */}
            <div className="col-lg-4">
              <div 
                className="p-4 rounded-4 mb-3"
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                  <ThumbsUp size={18} style={{ color: '#34d399' }} /> Helpful Tips
                </h6>
                <ul className="list-unstyled small mb-0 d-flex flex-column gap-2.5" style={{ color: '#cbd5e1' }}>
                  <li className="d-flex align-items-start gap-2">
                    <span 
                      className="rounded-circle px-2 py-0.5 fw-bold font-monospace"
                      style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '11px', border: '1px solid rgba(56, 189, 248, 0.4)' }}
                    >1</span>
                    <span><strong>Be Specific:</strong> Mention device name (e.g., AG Pump 1) or specific module path.</span>
                  </li>
                  <li className="d-flex align-items-start gap-2">
                    <span 
                      className="rounded-circle px-2 py-0.5 fw-bold font-monospace"
                      style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '11px', border: '1px solid rgba(56, 189, 248, 0.4)' }}
                    >2</span>
                    <span><strong>Attach Screenshots:</strong> Screenshots help our technical team debug UI or alarm errors quickly.</span>
                  </li>
                  <li className="d-flex align-items-start gap-2">
                    <span 
                      className="rounded-circle px-2 py-0.5 fw-bold font-monospace"
                      style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '11px', border: '1px solid rgba(56, 189, 248, 0.4)' }}
                    >3</span>
                    <span><strong>Track Status:</strong> Switch to the 'Feedback History' tab anytime to see resolution status.</span>
                  </li>
                </ul>
              </div>

              <div 
                className="p-4 rounded-4"
                style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)' }}
              >
                <h6 className="fw-bold mb-2" style={{ color: '#38bdf8' }}>Need Immediate Technical Support?</h6>
                <p className="small mb-3" style={{ color: '#cbd5e1' }}>For critical system emergencies or live electrical monitoring assistance, contact our 24/7 Control Room desk.</p>
                <div className="small text-white">
                  <div><strong>Email:</strong> support@bms-control.com</div>
                  <div><strong>Hotline:</strong> +1 (800) 555-BMS-HELP</div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* History View */
          <div 
            className="p-4 rounded-4 shadow-lg"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            <h5 className="fw-bold text-white mb-3 d-flex align-items-center justify-content-between">
              <span>Submitted Feedback History</span>
              <span 
                className="px-2.5 py-1 rounded-pill fw-bold font-monospace"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', fontSize: '12px' }}
              >
                {feedbackList.length} items
              </span>
            </h5>

            {feedbackList.length === 0 ? (
              <div className="text-center py-5" style={{ color: '#94a3b8' }}>
                <FileText size={48} className="opacity-40 mb-2" />
                <p className="mb-0">No feedback submitted yet.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {feedbackList.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 rounded-3"
                    style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                  >
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-2">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span 
                          className="px-2 py-0.5 rounded fw-bold font-monospace"
                          style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', fontSize: '12px' }}
                        >
                          {item.id}
                        </span>
                        <span className="fw-bold text-white fs-6">{item.title}</span>
                        <span 
                          className="px-2 py-0.5 rounded fw-semibold"
                          style={getCategoryBadgeStyle(item.category)}
                        >
                          {item.category}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span 
                          className="px-2.5 py-0.5 rounded fw-bold"
                          style={getStatusBadgeStyle(item.status)}
                        >
                          {item.status}
                        </span>
                        <span className="small font-monospace" style={{ color: '#94a3b8' }}>{item.date}</span>
                      </div>
                    </div>

                    <p className="small mb-2" style={{ color: '#cbd5e1' }}>{item.description}</p>

                    <div 
                      className="d-flex align-items-center justify-content-between pt-2 small"
                      style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}
                    >
                      <div className="d-flex align-items-center gap-1">
                        <span className="me-1" style={{ color: '#cbd5e1' }}>Rating:</span>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} style={{ color: i < item.rating ? '#fbbf24' : '#475569', fill: i < item.rating ? '#fbbf24' : 'none' }} />
                        ))}
                      </div>
                      <div>Priority: <strong className="text-white">{item.priority}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Feedback;
