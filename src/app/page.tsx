import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/journal');
  // return null; // redirect will handle this
}
