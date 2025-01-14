import ConfigurablePredictionModel from '../components/lotto/ConfigurablePredictionModel';

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-right">מחולל הגרלות לוטו</h1>
      <ConfigurablePredictionModel />
    </div>
  );
}