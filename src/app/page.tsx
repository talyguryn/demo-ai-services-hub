"use client";

const projects = [
  {
    name: "FacePoster",
    description:
      "Generate stunning posters by uploading your photo and selecting a poster style.",
    href: "/faceposter",
  },
  {
    name: "StyleTransfer",
    description:
      "Transform your photos into artwork using advanced style transfer techniques.",
    href: "/style-transfer",
    isDisabled: false,
  },
];

export default function Page() {
  return (
    <main className="">
      <div className="min-h-screen flex flex-col max-w-3xl mx-auto p-4">
        <div className="">
          <h1 className="text-5xl font-bold mb-2 text-white">
            AI Services Hub
          </h1>
          <p className="text-lg text-violet-300">
            Discover our most popular apps
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-1">
          {projects.map((project) => (
            <a
              key={project.name}
              href={project.isDisabled ? undefined : project.href}
              className={`no-underline! text-white border rounded-lg p-4 py-2 border-white/20 hover:border-white/30 hover:bg-white/10 transition ${
                project.isDisabled ? "opacity-50 cursor-not-allowed" : ""
              } `}
            >
              <div className="p-4 flex flex-col items-start justify-between">
                <h2 className="text-3xl font-bold mb-2">{project.name}</h2>
                <p className="text-lg text-violet-300">{project.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
