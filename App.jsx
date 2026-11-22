import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enquiries, setEnquiries] = useState([])
  const [form, setForm] = useState({ customer_name: '', email: '', phone: '', property_address: '', service_required: 'Property clearance', message: '' })
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadEnquiries() {
    const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false })
    if (error) setNotice(error.message)
    else setEnquiries(data || [])
  }

  useEffect(() => { if (session && supabase) loadEnquiries() }, [session])

  async function submitEnquiry(e) {
    e.preventDefault()
    setNotice('Sending enquiry…')
    const { error } = await supabase.from('enquiries').insert([form])
    if (error) setNotice(`Could not send enquiry: ${error.message}`)
    else {
      setNotice('Thank you. Your enquiry has been received.')
      setForm({ customer_name: '', email: '', phone: '', property_address: '', service_required: 'Property clearance', message: '' })
    }
  }

  async function signIn(e) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setNotice(error ? error.message : 'Signed in.')
  }

  async function signOut() {
    await supabase.auth.signOut()
    setEnquiries([])
    setNotice('Signed out.')
  }

  if (!supabase) return <main className="wrap"><h1>Property Rescue</h1><p>Supabase connection is not configured yet. Add your project URL and publishable key to the .env file, then restart the app.</p></main>

  return <main className="wrap">
    <header><div className="brand">PROPERTY <span>RESCUE</span></div><p>We take property problems off your hands.</p></header>
    <section className="hero"><div><p className="eyebrow">KENT PROPERTY SUPPORT</p><h1>One point of contact for property problems.</h1><p>Practical coordination for clearances, repairs, empty homes and property preparation across Dover, Deal, Sandwich, Folkestone and Thanet.</p></div></section>
    <div className="grid">
      <section className="panel"><h2>Tell us what you need</h2><p>Send an enquiry and we'll review the details.</p>
        <form onSubmit={submitEnquiry}>
          <label>Your name<input required value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})}/></label>
          <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
          <label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
          <label>Property address<input value={form.property_address} onChange={e=>setForm({...form,property_address:e.target.value})}/></label>
          <label>What do you need help with?<select value={form.service_required} onChange={e=>setForm({...form,service_required:e.target.value})}><option>Property clearance</option><option>Repairs and refurbishment coordination</option><option>Empty property checks</option><option>Preparing a property for sale or rent</option><option>Probate or inherited property</option><option>Other</option></select></label>
          <label>More details<textarea rows="4" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/></label>
          <button>Send enquiry</button>
        </form>
      </section>
      <section className="panel admin"><h2>Admin area</h2>
        {!session ? <><p>Sign in to manage enquiries.</p><form onSubmit={signIn}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button>Sign in</button></form></> :
        <><div className="adminbar"><span>Signed in: {session.user.email}</span><button className="secondary" onClick={signOut}>Sign out</button></div><h3>Recent enquiries</h3><button className="secondary" onClick={loadEnquiries}>Refresh</button>{enquiries.length===0 ? <p>No enquiries yet.</p> : enquiries.map(item=><article className="enquiry" key={item.id}><strong>{item.customer_name}</strong><span>{item.service_required || 'General enquiry'}</span><small>{item.email} · {item.phone}</small><p>{item.property_address}</p><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString()}</small></article>)}</>}
      </section>
    </div>
    {notice && <p className="notice" role="status">{notice}</p>}
    <footer>Property Rescue · Independent property project coordination. Specialist work is carried out by appropriately qualified contractors.</footer>
  </main>
}
