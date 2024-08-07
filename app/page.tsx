import MultiStepForm from "@/components/MultiStepForm";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Tabulate 💸</h1>
      <p className="text-sm mb-4">Split the restaurant tab with friends.</p>
      <MultiStepForm />
    </main>
  );
}
