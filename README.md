# Finance Tracker

A personal finance app for managing monthly income, expenses and financial commitments. The app is built with Expo (React Native) and an Express backend that uses Gemini API to scan payslips and receipts.

<p align="center">
  <img width="220" alt="Dashboard" src="https://github.com/user-attachments/assets/d77d71c9-5b79-417c-a59f-d84d86f6f4b0" />
  <img width="220" alt="Financial Commitments List View" src="https://github.com/user-attachments/assets/f6f10fef-d6c3-4a5e-9825-cfa706dd9ba6" />
  <img width="220" alt="Financial Commitments Calendar View" src="https://github.com/user-attachments/assets/461b8447-168c-4bf8-bab3-963f824acac4" />
  <img width="220" alt="Spending Overview" src="https://github.com/user-attachments/assets/d390d7b7-8199-4ff7-8e29-82cf874e260e" />
</p>

## Features

- **Monthly dashboard:** track income and expenses month by month, and see how much is left to spend
- **Financial commitments:** set up recurring bills such as loans, subscriptions, utilities and more, and check them off each month in a list or calendar view
- **Spending overview:** see where your money goes with a donut chart and a per-category breakdown
- **AI document scan:** upload a payslip or receipt and the fields are extracted and categorized automatically
- **Google Drive backup:** back up and restore your data with your own Google account

## Demo

<table>
  <tr>
    <td align="center"><b>#1 Scan payslip</b></td>
    <td align="center"><b>#2 Scan receipt</b></td>
  </tr>
  <tr>
    <td><video src="https://github.com/user-attachments/assets/ecd80c8e-8cc9-4a53-a8de-e1631f1259a9" width="200" controls muted></video></td>
    <td><video src="https://github.com/user-attachments/assets/5b868d41-94b9-44e2-b40b-f522c1274245" width="200" controls muted></video></td>
  </tr>
  <tr>
    <td align="center"><b>#3 Back up to Drive</b></td>
    <td align="center"><b>#4 Restore from Drive</b></td>
  </tr>
  <tr>
    <td><video src="https://github.com/user-attachments/assets/d270ef90-bdc7-404b-88b4-3864b444ea43" width="200" controls muted></video></td>
    <td><video src="https://github.com/user-attachments/assets/75734a26-1845-45aa-a055-6392c72b75d3" width="200" controls muted></video></td>
  </tr>
</table>

## Tech stack

| Area | Technology |
|---|---|
| App | Expo SDK `57`, React Native `0.86`, React `19.2.3`, TypeScript `6.0.3` |
| Navigation | React Navigation (drawer, stack, material top tabs) |
| Styling / UI | NativeWind `5.0` (Tailwind CSS v4), gluestack-ui, lucide-react-native |
| Animation / charts | react-native-reanimated, react-native-svg |
| Storage | AsyncStorage |
| Auth / backup | Google Sign-In, Google Drive API |
| Backend | Node.js `22+`, Express `5`, Multer, Google Gemini API (`@google/genai`) |
| Build / updates | EAS Build, EAS Update |
