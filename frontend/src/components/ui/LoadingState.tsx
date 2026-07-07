export function LoadingState({ message }: { message: string }) {
  return (
    <div className="message-box loading-box" role="status" aria-live="polite">
      <span className="loading-dot" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
