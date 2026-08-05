import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { Eye, EyeOff } from 'lucide-react';

/**
 * PasswordInput — reusable password field with show/hide eye toggle
 *
 * @param {object}   props
 * @param {string}   props.value          - controlled value
 * @param {function} props.onChange        - change handler
 * @param {string}   [props.placeholder]  - placeholder text
 * @param {string}   [props.className]    - extra CSS classes for the <input>
 * @param {boolean}  [props.required]     - html required attribute
 * @param {object}   [props.iconProps]    - props forwarded to the icon wrapper div
 * @param {object}   rest                 - any other props passed to Form.Control
 */
const PasswordInput = ({
  value,
  onChange,
  placeholder = '••••••••',
  className = '',
  required = false,
  iconProps = {},
  ...rest
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="position-relative">
      <Form.Control
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className={className}
        value={value}
        onChange={onChange}
        required={required}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        className="password-eye-btn"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        {...iconProps}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>

      <style>{`
        .password-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 4px;
          color: rgba(255, 255, 255, 0.45);
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
          border-radius: 4px;
        }
        .password-eye-btn:hover {
          color: rgba(255, 255, 255, 0.8);
        }
        .password-eye-btn:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default PasswordInput;
