import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface SignUpProps {
	email: string;
	password: string;
}

export default function Register() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

	const provider = new GoogleAuthProvider();
	const navigate = useNavigate();

	const persistToken = async (tokenPromise: Promise<string>) => {
		const idToken = await tokenPromise;
		localStorage.setItem("token", idToken);
		return idToken;
	};

	const signUp = async ({ email, password }: SignUpProps) => {
		const userCredential = await createUserWithEmailAndPassword(auth, email, password);
		const user = userCredential.user;
		return user.getIdToken(true);
	};

	const signInWithGoogle = async () => {
		const result = await signInWithPopup(auth, provider);
		const user = result.user;
		return user.getIdToken();
	};

	const handleEmailPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		setIsSubmitting(true);
		try {
			await persistToken(signUp({ email, password }));
		} catch (err: any) {
			setError(err?.message || "Unable to create an account. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleGoogleSubmit = async () => {
		setError(null);
		setIsSubmitting(true);
		try {
			await persistToken(signInWithGoogle());
		} catch (err: any) {
			setError(err?.message || "Google sign-up failed. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onloadend = () => {
			const base64 = reader.result?.toString() || "";
			setAvatarPreview(base64);
			console.log("Avatar base64:", base64);
		};

		reader.readAsDataURL(file);
	};

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			if (user) {
				navigate("/home");
			}
		});
		return () => unsubscribe();
	}, [navigate]);

	return (
		<div className="min-h-screen bg-[var(--color-primary)] text-[var(--text-color-default)]">
			<div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
				<section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-accent)] via-[#2f3140] to-[var(--color-primary)] text-white hidden sm:flex">
					<div
						className="absolute inset-0 opacity-50"
						style={{
							background:
								"radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 30%), radial-gradient(circle at 80% 10%, rgba(108,99,255,0.18), transparent 25%), radial-gradient(circle at 50% 80%, rgba(0,190,255,0.15), transparent 25%)",
						}}
					/>
					<div className="relative flex h-full flex-col justify-between gap-10 p-10 lg:p-14">
						<div className="flex items-center gap-3">
							<img src="/cogniva-landscape-logo.svg" className="h-10" alt="Cogniva logo" />
							<span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">Private preview</span>
						</div>

						<div className="space-y-6 max-w-2xl">
							<p className="text-3xl font-semibold leading-tight lg:text-4xl">Create your Cogniva workspace.</p>
							<p className="text-base text-white/80 lg:text-lg">
								Spin up a fresh account so your team can collaborate with structured, reliable conversational outputs.
							</p>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								{["Guided onboarding", "Secure Firebase auth", "Workspace-first UI", "Export-ready chat"].map((item) => (
									<div key={item} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/85 backdrop-blur">
										{item}
									</div>
								))}
							</div>
						</div>

						<div className="flex flex-wrap gap-3 text-xs text-white/70">
							<span className="rounded-full border border-white/20 px-3 py-1">Fast team setup</span>
							<span className="rounded-full border border-white/20 px-3 py-1">Encrypted storage</span>
							<span className="rounded-full border border-white/20 px-3 py-1">Live collaboration</span>
						</div>
					</div>
				</section>

				<section className="flex items-center justify-center p-8 lg:p-12">
					<div className="w-full max-w-md space-y-8 rounded-2xl border border-[var(--color-secondary)]/50 bg-[var(--color-accent)]/60 p-8 shadow-xl backdrop-blur">
						<div className="space-y-2 text-center">
							<h1 className="text-2xl font-semibold text-white">Create your account</h1>
							<p className="text-sm text-[var(--text-color-default)]">Start collaborating in Cogniva with secure, synced chat.</p>
						</div>

						{error ? (
							<div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
								{error}
							</div>
						) : null}

						<form className="space-y-4" onSubmit={handleEmailPasswordSubmit}>
							<div className="space-y-2">
								<label className="text-sm text-[var(--text-color-default)]" htmlFor="email">
									Email
								</label>
								<input
									id="email"
									type="email"
									placeholder="you@company.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full rounded-lg border border-[var(--color-secondary)]/50 bg-[var(--color-primary)]/40 px-4 py-3 text-white placeholder:text-[var(--text-color-default)]/60 shadow-inner focus:border-white/60 focus:outline-none"
									required
									autoComplete="email"
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm text-[var(--text-color-default)]" htmlFor="password">
									Password
								</label>
								<input
									id="password"
									type="password"
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full rounded-lg border border-[var(--color-secondary)]/50 bg-[var(--color-primary)]/40 px-4 py-3 text-white placeholder:text-[var(--text-color-default)]/60 shadow-inner focus:border-white/60 focus:outline-none"
									required
									autoComplete="new-password"
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm text-[var(--text-color-default)]" htmlFor="confirmPassword">
									Confirm password
								</label>
								<input
									id="confirmPassword"
									type="password"
									placeholder="••••••••"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className="w-full rounded-lg border border-[var(--color-secondary)]/50 bg-[var(--color-primary)]/40 px-4 py-3 text-white placeholder:text-[var(--text-color-default)]/60 shadow-inner focus:border-white/60 focus:outline-none"
									required
									autoComplete="new-password"
								/>
							</div>

							<div className="space-y-2">
								<span className="text-sm text-[var(--text-color-default)]">Profile picture</span>
								<label
									htmlFor="avatar"
									className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-[var(--color-secondary)]/60 bg-[var(--color-primary)]/30 px-4 py-3 text-sm text-white transition hover:border-[var(--color-secondary)] hover:bg-[var(--color-accent)]/40"
								>
									<div className="flex items-center gap-3">
										<div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[var(--color-secondary)]/50 bg-[var(--color-primary)]/50">
											{avatarPreview ? <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" /> : <span className="text-xs text-[var(--text-color-default)]/80">No image</span>}
										</div>
										<div>
											<p className="font-semibold">Upload a profile photo</p>
											<p className="text-xs text-[var(--text-color-default)]/80">PNG or JPG, logs base64 to console</p>
										</div>
									</div>
									<span className="rounded-md border border-[var(--color-secondary)]/60 px-3 py-1 text-xs font-semibold text-white">Choose file</span>
								</label>
								<input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
							</div>

							<button
								type="submit"
								disabled={isSubmitting}
								className="button w-full bg-[var(--color-secondary)] hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSubmitting ? "Creating account..." : "Create account"}
							</button>
						</form>

						<div className="flex items-center gap-3 text-xs text-[var(--text-color-default)]/80">
							<span className="h-px flex-1 bg-[var(--color-secondary)]/40" />
							<span>or</span>
							<span className="h-px flex-1 bg-[var(--color-secondary)]/40" />
						</div>

						<button
							type="button"
							onClick={handleGoogleSubmit}
							disabled={isSubmitting}
							className="w-full rounded-lg border border-[var(--color-secondary)]/50 bg-[var(--color-primary)]/60 px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-accent)]/70 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Continue with Google
						</button>

						<div className="text-center text-xs text-[var(--text-color-default)]/80">
							<p className="mb-2">Already have an account?</p>
							<button
								type="button"
								onClick={() => navigate("/")}
								className="text-sm font-semibold text-white underline underline-offset-4 hover:text-[var(--color-secondary)]"
							>
								Sign in instead
							</button>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
