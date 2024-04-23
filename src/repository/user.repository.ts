import {
  Firestore,
  QueryDocumentSnapshot,
  QuerySnapshot,
  SnapshotOptions,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { injectable } from "tsyringe";
import FirebaseConfiguration from "../configuration/firebase.configuration";
import User from "../model/user.model";

@injectable()
export default class UserRepository {
  private readonly firestore: Firestore;
  private readonly databaseName: string;

  constructor(firebaseConfiguration: FirebaseConfiguration) {
    this.firestore = firebaseConfiguration.getFirestore();
    this.databaseName = firebaseConfiguration.getDatabaseName();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const queryByEmailSnapshot = await this.queryByEmailSnapshot(email);
    return queryByEmailSnapshot.empty === false;
  }

  private async queryByEmailSnapshot(email: string): Promise<QuerySnapshot> {
    const documentQuery = query(
      collection(this.firestore, this.databaseName),
      where("email", "==", email),
    );
    return await getDocs(documentQuery);
  }

  async createPartial(user: User): Promise<void> {
    const documentReference = doc(this.firestore, this.databaseName, user.id).withConverter(
      this.userConverter,
    );
    await setDoc(documentReference, user);
  }

  private userConverter = {
    toFirestore: (user: User) => {
      return {
        id: user.id,
        email: user.email,
        password: user.password,
        isPartial: user.isPartial,
        updatedAt: user.updatedAt,
        createdAt: user.createdAt,
      };
    },
    fromFirestore: (
      queryDocumentSnapshot: QueryDocumentSnapshot,
      snapshotOptions: SnapshotOptions,
    ) => {
      return queryDocumentSnapshot.data(snapshotOptions) as User;
    },
  };

  async completeRegistration(user: User): Promise<void> {
    const nonPartialUser = user.copyAsPermanent();
    const documentReference = doc(
      this.firestore,
      this.databaseName,
      nonPartialUser.id,
    ).withConverter(this.userConverter);
    await setDoc(documentReference, nonPartialUser);
  }
}
