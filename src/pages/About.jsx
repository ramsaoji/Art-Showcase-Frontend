import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-24">
          <div className="lg:pt-4">
            <div className="mx-auto max-w-2xl">
              <div className="max-w-lg">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  About ArtShowcase
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Welcome to ArtShowcase, where we bridge the gap between
                  exceptional artists and art enthusiasts. Our platform is
                  dedicated to making fine art accessible, discoverable, and
                  collectible.
                </p>
                <div className="mt-8 flex items-center gap-x-6">
                  <Link
                    to="/gallery"
                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Explore Gallery
                  </Link>
                  <Link
                    to="/contact"
                    className="text-sm font-semibold leading-6 text-gray-900"
                  >
                    Contact Us <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 sm:mt-20 lg:mt-0">
            <div className="shadow-lg md:rounded-3xl">
              <div className="bg-indigo-500 [clip-path:inset(0)] md:[clip-path:inset(0_round_theme(borderRadius.3xl))]">
                <div className="absolute -inset-y-px left-1/2 -z-10 ml-10 w-[200%] skew-x-[-30deg] bg-indigo-100 opacity-20 ring-1 ring-inset ring-white" />
                <div className="relative px-6 pt-8 sm:pt-16 md:pl-16 md:pr-0">
                  <div className="mx-auto max-w-2xl md:mx-0 md:max-w-none">
                    <img
                      src="https://images.unsplash.com/photo-1544967082-d9d25d867d66?ixlib=rb-4.0.3"
                      alt="Gallery interior"
                      className="w-full h-auto rounded-tl-xl rounded-tr-xl bg-gray-50 object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-3xl font-semibold leading-7 text-indigo-600">
            Our Mission
          </h2>
          <p className="mt-4 text-xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Empowering Artists, Inspiring Collectors
          </p>
          <p className="mt-6 text-xl leading-8 text-gray-600">
            We believe in creating meaningful connections between artists and
            art lovers, fostering a community that celebrates creativity and
            supports artistic excellence.
          </p>
        </div>
        <div className="mx-auto mt-10 sm:mt-12 lg:mt-16 max-w-2xl lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-8 lg:max-w-none lg:grid-cols-3 lg:gap-y-12">
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                Curated Excellence
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  We carefully select and showcase exceptional artworks from
                  both emerging and established artists, ensuring a diverse and
                  high-quality collection.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                Global Reach
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  Our platform connects artists with art enthusiasts worldwide,
                  breaking down geographical barriers and creating new
                  opportunities.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                Secure Transactions
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  We provide a safe and transparent environment for art
                  transactions, ensuring both artists and collectors feel
                  confident and protected.
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8 lg:py-20">
          <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-16 sm:py-20 lg:py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Join Our Art Community
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
              Whether you're an artist looking to showcase your work or a
              collector seeking unique pieces, we invite you to be part of our
              growing community.
            </p>
            <div className="mt-8 sm:mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/contact"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get Started
              </Link>
              <Link
                to="/gallery"
                className="text-sm font-semibold leading-6 text-white"
              >
                Learn More <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
