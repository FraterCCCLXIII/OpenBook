import { useParams } from 'react-router-dom';

export function CustomerFormDetailPage() {
  const { formId } = useParams();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-50">Form {formId}</h1>
      <p className="mt-2 text-zinc-400">Dynamic form rendering (placeholder).</p>
    </div>
  );
}
