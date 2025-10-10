# vCards Admin – Branding + Tekst pr. knapp (Netlify)

## Nytt i denne versjonen
- **Branding-profiler per organisasjon** (auto-fyll logo, accent, site når du skriver OrgKey)
- **Ubegrensa lenker per person**, med **tekst over/under hver knapp** (f.eks. call-to-action eller forklaring)
- Fortsatt multi-tenant og auto-commit (branch + PR som standard)

## Oppsett
1. Legg koden i et repo og deploy på Netlify.
2. I Netlify → Environment variables:
   - `GITHUB_TOKEN` (fine-grained, Contents: RW for kunde-repoet/-a)
   - (valgfritt) `GITHUB_OWNER`, `GITHUB_REPO`, `BASE_PATH` (default `Vcards`)
3. Rediger `ORG_PROFILES` i `admin.html` for å legge inn standard logo/farger for kundene dine.
4. Åpne Netlify-URL, fyll inn og publiser.

## Resultat i GitHub
```
Vcards/<OrgKey>/<slug>/<vcf>
Vcards/<OrgKey>/<slug>/index.html
Vcards/.nojekyll
```
NFC-URL:
```
https://<owner>.github.io/<repo>/Vcards/<OrgKey>/<slug>/<vcf>
```

## Sikkerhet
- PAT holdes kun som Netlify-secret. UI sender aldri token i nettleser.
- PR-strategi anbefales (review før merge).
