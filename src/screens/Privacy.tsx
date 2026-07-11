import { Link } from 'react-router-dom'
import LegalPage, { H2 } from '../components/LegalPage'

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="June 2026">
      <p>
        This policy explains what LunaCat collects, why, how it is stored, and the
        choices you have. We try to collect only what the app needs to keep a useful
        record of your cat.
      </p>

      <H2>What we collect</H2>
      <p>
        <strong>Account information:</strong> your email address and a Firebase
        authentication identifier, used to sign you in and to associate your data
        with you.
      </p>
      <p>
        <strong>Cat records and health observations:</strong> everything you log —
        your cat's profile (name, breed, date of birth, weight), daily check-ins,
        meals, litter-box and symptom observations, vaccinations, medications, vet
        visits, and any documents you upload (such as bloodwork or photos).
      </p>
      <p>
        <strong>Derived signals:</strong> baselines and pattern flags the app
        computes from your logs. These are stored alongside your records so trends
        persist over time.
      </p>

      <H2>How it's used</H2>
      <p>
        Your data is used to run the app for you: to show your cat's history, learn
        what is normal for your cat, surface observational patterns, and produce a
        vet-ready summary you can share. We do not sell your data, and we do not use
        it for advertising.
      </p>

      <H2>How it's stored</H2>
      <p>
        Records are stored in a PostgreSQL database controlled by the LunaCat
        operator. Sign-in is handled by Google Firebase Authentication, which
        processes your email and credentials under Google's terms. Uploaded
        documents are stored with your cat's record. We take reasonable measures to
        protect your data, but no system is perfectly secure.
      </p>

      <H2>Outputs are not diagnoses</H2>
      <p>
        Health-related output in LunaCat is observational and preliminary, and its
        thresholds have not been clinically validated. It is not medical advice or a
        diagnosis. See the <Link to="/terms" style={{ color: '#6B6BD6' }}>Terms of
        Service</Link> for the full disclaimer.
      </p>

      <H2>Data sharing</H2>
      <p>
        We share data only with the infrastructure providers needed to run the
        service (for example Firebase for authentication). We do not share your cat's
        records with other users. Anything you choose to export and hand to your vet
        is shared by you, at your discretion.
      </p>

      <H2>Retention and your rights</H2>
      <p>
        We keep your records for as long as your account is active. You have the
        right to access, export, or delete your data. Today these requests are
        handled by contacting us (an in-app export/delete control is planned);
        deleting your account removes your owner record and the cat records linked to
        it.
      </p>

      <H2>Contact</H2>
      <p>
        For any privacy request or question, use the contact option in your profile.
      </p>
    </LegalPage>
  )
}
