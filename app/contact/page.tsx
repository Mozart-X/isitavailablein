import SuggestForm from '@/components/SuggestForm';

export const metadata = { title: 'Contact', description: 'Contact IsItAvailableIn.' };

export default function Contact() {
  return (
    <article>
      <h1>Contact</h1>
      <p>Found an error? A service we should add? A country missing? Send a note:</p>
      <SuggestForm />
    </article>
  );
}
