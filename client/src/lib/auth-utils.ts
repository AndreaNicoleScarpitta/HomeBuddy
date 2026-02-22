export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

// Redirect to login with a toast notification
export function redirectToLogin(toast?: (options: { title: string; description: string; variant: string }) => void) {
  if (toast) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
  }
  setTimeout(() => {
    const link = document.createElement('a');
    link.href = '/api/login';
    link.target = '_top';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, 500);
}
