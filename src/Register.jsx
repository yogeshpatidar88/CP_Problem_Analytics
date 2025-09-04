// src/Register.jsx
import React, { useState, useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import githubDark from 'monaco-themes/themes/GitHub Dark.json';
import './Register.css';
import axios from 'axios';

const Register = ({ onRegister, onSwitch, onBackToHome }) => {
  const defaultCode = `#include <iostream>
using namespace std;

int main(){
    string username = ""; // Enter your username here
    string email = ""; // Enter your email here
    string password = ""; // Enter your password here
    cout << "Registration successful for " << username << " !" << endl;
    return 0;
}
  `;

  const [code, setCode] = useState(defaultCode);
  const [realPassword, setRealPassword] = useState(""); // Store the real password
  const editorRef = useRef(null);

  useEffect(() => {
    loader.init().then((monacoInstance) => {
      monacoInstance.editor.defineTheme('github-dark', {
        ...githubDark,
        colors: {
          ...githubDark.colors,
          'editor.background': '#000000',
        },
      });
    });
  }, []);

  const maskPasswordInCode = (passwordLength) => {
    return `"${"*".repeat(passwordLength)}"`;
  };

  const handleEditorChange = (value) => {
    const editor = editorRef.current;
    if (!editor) return;

    const cursorPosition = editor.getPosition(); // Save cursor position
    const passwordMatch = value.match(/string password = "(.*?)";/);

    if (passwordMatch) {
      const maskedPassword = passwordMatch[1]; // Extract the current masked password
      let updatedPassword = "";

      // Update the actual password while respecting masked characters
      for (let i = 0; i < maskedPassword.length; i++) {
        if (maskedPassword[i] === "*") {
          // Keep the real password character if the masked character is "*"
          updatedPassword += realPassword[i] || "";
        } else {
          // Add the new character to the actual password
          updatedPassword += maskedPassword[i];
        }
      }

      // Update the real password state
      setRealPassword(updatedPassword);

      // Replace the password field with masked content
      const maskedCode = value.replace(
        /string password = "(.*?)";/,
        `string password = ${maskPasswordInCode(updatedPassword.length)};`
      );
      setCode(maskedCode);

      // Restore the cursor position
      setTimeout(() => {
        editor.setPosition(cursorPosition);
        editor.focus();
      }, 0);
    } else {
      // Update the code normally for non-password-related changes
      setCode(value);
    }
  };

  const handleRunCode = async () => {
    const usernameMatch = code.match(/string username = "(.*?)";/);
    const emailMatch = code.match(/string email = "(.*?)";/);

    const username = usernameMatch ? usernameMatch[1] : '';
    const email = emailMatch ? emailMatch[1] : '';

    console.log("Password being sent:", realPassword); // Debugging: Print the real password
    console.log("Username being sent:", username);    // Debugging: Print the username
    console.log("Email being sent:", email);          // Debugging: Print the email

    if (username && email && realPassword) {
      try {
        // Send the registration data to the backend /register endpoint
        const response = await axios.post("http://localhost:5000/api/users/register", {
          username,
          email,
          password: realPassword, // Password will be hashed server-side
        });
        alert(response.data.message);
        onRegister(username);
      } catch (error) {
        console.error("Registration error:", error);
        alert(error.response && error.response.data ? error.response.data.error : 'Registration failed');
      }
    } else {
      alert("Please enter username, email, and password in the code editor.");
    }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    const lineNumber = code.split('\n').findIndex(line => line.includes('string username')) + 1;
    const column = code.indexOf('string username = "') + 'string username = "'.length - code.lastIndexOf('\n', code.indexOf('string username = ""'));

    editor.setPosition({ lineNumber, column });
    editor.focus();
  };

  return (
    <div className="register-page">
      <button className="back-button" onClick={onBackToHome}>Back to Homepage</button>
      <h1 className="header">Codeforces Analytics - Register</h1>
      <div className="editor-container">
        <Editor
          width="100vh"
          height="38vh"
          defaultLanguage="cpp"
          value={code}
          theme="github-dark"
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            fontSize: 20,
            minimap: { enabled: false },
            wordWrap: 'on',
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden',
            },
            overviewRulerLanes: 0,
            scrollBeyondLastLine: false,
            lineNumbers: 'off',
            readOnly: false,
          }}
        />
      </div>
      <div className="button-container">
        <button onClick={handleRunCode}>
          Register
        </button>
        <button onClick={onSwitch}>
          Login
        </button>
      </div>
    </div>
  );
};

export default Register;