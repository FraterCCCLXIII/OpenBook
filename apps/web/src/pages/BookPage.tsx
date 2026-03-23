import { BookWizard } from '../components/BookWizard';

export function BookPage() {
  return (
    <div className="flex justify-center">
      <div id="book-appointment-wizard" className="w-full max-w-sm">
        <BookWizard />
      </div>
    </div>
  );
}
