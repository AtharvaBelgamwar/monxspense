export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 text-white">
      <h1 className="text-5xl font-bold mb-4">Welcome to MonXpense</h1>
      <p className="text-xl mb-6">Manage your expenses with ease</p>
      <a
        href="/sign_in"
        className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition duration-300 ease-in-out"
      >
        Get Started
      </a>
    </div>
  );
}
