import { createContext, useContext, useEffect, useState } from "react";
import { Client, PrivateKeyBundle } from "xmtp-js";
import newWallet from "../helpers/newWallet";

const localNodeBootstrapAddr =
  "/ip4/127.0.0.1/tcp/9001/ws/p2p/16Uiu2HAmNCxLZCkXNbpVPBpSSnHj9iq4HZQj7fxRzw2kj1kKSHHA";

// const testnetBootstrapAddr =
//   '/dns4/bootstrap-node-0.testnet.xmtp.network/tcp/8443/wss/p2p/16Uiu2HAm888gVYpr4cZQ4qhEendQW6oYEhG8n6fnqw1jVW3Prdc6'

type XmtpContextType = {
  client: Client | undefined;
  user: PrivateKeyBundle | undefined;
};

const XmtpContext = createContext<XmtpContextType>({
  client: undefined,
  user: undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useXmtp = (): XmtpContextType => {
  const context = useContext(XmtpContext);
  if (context === undefined) {
    throw new Error("useXmtp must be used within an XmtpProvider");
  }
  return context;
};

type XmtpProviderProps = {
  children?: React.ReactNode;
};

export const XmtpProvider = ({ children }: XmtpProviderProps): JSX.Element => {
  const [client, setClient] = useState<Client>();
  const [user, setUser] = useState<PrivateKeyBundle>();

  // Initialize the client.
  useEffect(() => {
    const initClient = async () => {
      setClient(
        await Client.create({
          bootstrapAddrs: [localNodeBootstrapAddr],
        })
      );
    };
    initClient();
  }, []);

  // Initialize the user private key bundle.
  useEffect(() => {
    const initUser = async () => {
      setUser(await PrivateKeyBundle.generate(newWallet()));
    };
    initUser();
  }, []);

  // Register user private key bundle, if necessary.
  useEffect(() => {
    const registerUser = async () => {
      if (!client || !user) return;
      const bundle = await client.getUserContact(
        user.identityKey.publicKey.walletSignatureAddress()
      );
      if (!bundle) {
        console.log(
          "publishing",
          user.getPublicKeyBundle().identityKey?.walletSignatureAddress()
        );
        await client.publishUserContact(user.getPublicKeyBundle());
      }
    };
    registerUser();
  }, [client, user]);

  return (
    <XmtpContext.Provider
      value={{
        client,
        user,
      }}
    >
      {children}
    </XmtpContext.Provider>
  );
};

export default XmtpContext;
