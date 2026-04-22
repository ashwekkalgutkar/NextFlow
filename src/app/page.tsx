import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect immediately to our application route
  redirect('/nodes');
}
