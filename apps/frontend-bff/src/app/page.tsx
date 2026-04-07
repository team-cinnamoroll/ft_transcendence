import { client } from '../lib/api'

export default async function HomePage() {
  const res = await client.hello.$get()
  const data = await res.json()

  return (
    <main>
      <h1>tracen dev environment</h1>
      <p>{data.message}</p>
    </main>
  )
}
