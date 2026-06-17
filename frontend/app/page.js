import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
export default function Home() {
  return (
    <div className="p-5">
      <Show when="signed-out">
        <div className="flex justify-end gap-5">
          <SignInButton
            mode="modal"
            className="bg-red-600 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer"
          />
          <SignUpButton mode="modal">
            <button className="bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="flex justify-end gap-5">
          <UserButton />
        </div>
      </Show>
    </div>
  );
}
