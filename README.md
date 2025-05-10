# 📝 Sergeants Exams System

## <a name="introduction">🎉 Introduction</a>

The **Sergeants Exams System** is a web-based platform designed to facilitate the administration of exams for sergeants. It allows administrators to register examiners with auto-generated passwords and enables examiners to take exams securely. Upon completion, examiners receive their scores and percentages.

> 🛠️ **Note:** This project was developed during my military service period without any internet access. I contributed primarily to the **frontend** development using Bootstrap and also assisted in backend development.

## <a name="tech-stack">⚙️ Tech Stack</a>

- **Backend:**
  - Node.js
  - Express.js
  - LiteSQL

- **Frontend:**
  - EJS (Embedded JavaScript Templates)
  - HTML/CSS
  - JavaScript
  - Bootstrap

- **Environment Management:**
  - dotenv

## <a name="features">🔋 Features</a>

👉 **Admin Panel:**
- Secure login using credentials defined in the `.env` file.
- Register examiners with auto-generated random passwords.
- Manage examiner information and exam details.

👉 **Examiner Access:**
- Login using assigned ID and password.
- Take assigned exams within the platform.
- Receive immediate feedback with scores and percentages upon completion.

👉 **Exam Management:**
- Create and manage exam questions and answers.
- Monitor examiner progress and results.

## <a name="prerequisites">🔧 Prerequisites</a>

Ensure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

## <a name="installation">🚀 Installation</a>

1. **Clone the repository:**
    ```bash
    git clone https://github.com/YousifMHelal/SergeantsExamsSystem.git
    ```

2. **Navigate to the project directory:**
    ```bash
    cd SergeantsExamsSystem
    ```

3. **Install dependencies:**
    ```bash
    npm install
    ```

4. **Configure environment variables:**

    Create a `.env` file in the root directory and add the following:

    ```env
    PORT=5000
    DATABASE_URL=your_litesql_database_path
    ADMIN_USERNAME=your_admin_username
    ADMIN_PASSWORD=your_admin_password
    STORAGE_URL=your_storage_url
    ```

    Replace the placeholder values with your actual configuration.

5. **Start the application:**
    ```bash
    npm start
    ```

6. **Access the application:**

    Open your browser and navigate to `http://localhost:5000`

## <a name="usage">📘 Usage</a>

- **Admin Panel:**
  - Log in using the admin credentials stored in the `.env` file.
  - Register examiners and assign them auto-generated passwords.
  - Create and manage exam content.

- **Examiner Portal:**
  - Log in using the provided ID and password.
  - Complete assigned exams.
  - View immediate results and performance metrics.

---

## <a name="note">📌 Important Note</a>

This project was created under unique circumstances—during my military service—with **no internet access** or external help. I independently worked on the **frontend** using **Bootstrap** and contributed to the **backend** development. This experience enhanced my skills in self-reliance, problem-solving, and full-stack development.
