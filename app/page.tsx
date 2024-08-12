import MultiStepForm from "@/components/MultiStepForm";

export default function Home() {
  return (
    <main className="container">
      <header className="py-4 sticky top-0 z-50 w-full bg-background">
        <h1 className="text-2xl font-bold">Tabulate 💸</h1>
      </header>
      <div className="py-4 m-auto md:max-w-xl">
        <MultiStepForm />
      </div>
    </main>
  );
}
