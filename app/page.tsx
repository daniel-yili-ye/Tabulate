import MultiStepForm from "@/components/MultiStepForm";

export default function Home() {
  return (
    <main className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Tabulate 💸</h1>
      <MultiStepForm />
    </main>
  );
}
