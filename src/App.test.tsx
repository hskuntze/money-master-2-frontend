import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

test("renderiza a landing page do Money Master 2", () => {
  render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>,
  );
  expect(screen.getAllByText(/Money Master 2/i).length).toBeGreaterThan(0);
});
