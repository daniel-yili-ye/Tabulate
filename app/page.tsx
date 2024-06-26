import MultiStepForm from "@/components/MultiStepForm";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Meal Receipt Splitter</h1>
      <MultiStepForm />
    </main>
  );
}
