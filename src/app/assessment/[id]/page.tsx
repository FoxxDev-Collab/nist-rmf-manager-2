import { use } from 'react';

export default function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  console.log('Rendering AssessmentDetail with ID:', unwrappedParams.id);
  return <AssessmentDetail id={unwrappedParams.id} />
} 