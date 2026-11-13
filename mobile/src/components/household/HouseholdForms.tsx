import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {spacing} from '@/theme';
import type {
  HouseholdMember,
  HouseholdMemberInput,
  HouseholdRelation,
  Pet,
  PetInput,
  PetSpecies,
  Vehicle,
  VehicleInput,
} from '@/types/household';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';

const RELATION_KEYS = {
  SPOUSE: 'Household.relations.SPOUSE',
  CHILD: 'Household.relations.CHILD',
  PARENT: 'Household.relations.PARENT',
  OTHER: 'Household.relations.OTHER',
} as const;

const SPECIES_KEYS = {
  DOG: 'Household.species.DOG',
  CAT: 'Household.species.CAT',
  OTHER: 'Household.species.OTHER',
} as const;

const RELATIONS: HouseholdRelation[] = ['SPOUSE', 'CHILD', 'PARENT', 'OTHER'];
const SPECIES: PetSpecies[] = ['DOG', 'CAT', 'OTHER'];

function Actions({
  pending,
  canSubmit,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const {t} = useTranslation();

  return (
    <View style={styles.actions}>
      <Button
        title={t('Common.cancel')}
        variant="ghost"
        onPress={onCancel}
        disabled={pending}
        style={styles.action}
      />
      <Button
        title={t('Common.save')}
        onPress={onSubmit}
        loading={pending}
        disabled={!canSubmit}
        style={styles.action}
      />
    </View>
  );
}

export function MemberForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: HouseholdMember | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: HouseholdMemberInput) => void;
}) {
  const {t} = useTranslation();
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [relation, setRelation] = useState<HouseholdRelation>(
    initial?.relation ?? 'OTHER',
  );
  const [documentNumber, setDocumentNumber] = useState(
    initial?.documentNumber ?? '',
  );
  const [phone, setPhone] = useState(initial?.phone ?? '');

  const canSubmit = !!firstName.trim() && !!lastName.trim();

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      relation,
      ...(documentNumber.trim() ? {documentNumber: documentNumber.trim()} : {}),
      ...(phone.trim() ? {phone: phone.trim()} : {}),
    });
  };

  return (
    <View style={styles.form}>
      <Input
        label={t('Household.firstName')}
        value={firstName}
        onChangeText={setFirstName}
      />
      <Input
        label={t('Household.lastName')}
        value={lastName}
        onChangeText={setLastName}
      />
      <Select
        label={t('Household.relation')}
        value={relation}
        onChange={value => setRelation(value as HouseholdRelation)}
        options={RELATIONS.map(value => ({
          value,
          label: t(RELATION_KEYS[value]),
        }))}
      />
      <Input
        label={t('Household.documentNumber')}
        value={documentNumber}
        onChangeText={setDocumentNumber}
      />
      <Input
        label={t('Household.phone')}
        value={phone}
        onChangeText={setPhone}
      />
      <Actions
        pending={pending}
        canSubmit={canSubmit}
        onCancel={onCancel}
        onSubmit={submit}
      />
    </View>
  );
}

export function VehicleForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: Vehicle | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: VehicleInput) => void;
}) {
  const {t} = useTranslation();
  const [plate, setPlate] = useState(initial?.plate ?? '');
  const [make, setMake] = useState(initial?.make ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [color, setColor] = useState(initial?.color ?? '');

  const canSubmit = !!plate.trim();

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      plate: plate.trim(),
      ...(make.trim() ? {make: make.trim()} : {}),
      ...(model.trim() ? {model: model.trim()} : {}),
      ...(color.trim() ? {color: color.trim()} : {}),
    });
  };

  return (
    <View style={styles.form}>
      <Input
        label={t('Household.plate')}
        value={plate}
        onChangeText={setPlate}
        autoCapitalize="characters"
      />
      <Input label={t('Household.make')} value={make} onChangeText={setMake} />
      <Input
        label={t('Household.model')}
        value={model}
        onChangeText={setModel}
      />
      <Input
        label={t('Household.color')}
        value={color}
        onChangeText={setColor}
      />
      <Actions
        pending={pending}
        canSubmit={canSubmit}
        onCancel={onCancel}
        onSubmit={submit}
      />
    </View>
  );
}

export function PetForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: Pet | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: PetInput) => void;
}) {
  const {t} = useTranslation();
  const [name, setName] = useState(initial?.name ?? '');
  const [species, setSpecies] = useState<PetSpecies>(initial?.species ?? 'DOG');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const canSubmit = !!name.trim();

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      species,
      ...(notes.trim() ? {notes: notes.trim()} : {}),
    });
  };

  return (
    <View style={styles.form}>
      <Input
        label={t('Household.petName')}
        value={name}
        onChangeText={setName}
      />
      <Select
        label={t('Household.speciesLabel')}
        value={species}
        onChange={value => setSpecies(value as PetSpecies)}
        options={SPECIES.map(value => ({
          value,
          label: t(SPECIES_KEYS[value]),
        }))}
      />
      <Input
        label={t('Household.notes')}
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <Actions
        pending={pending}
        canSubmit={canSubmit}
        onCancel={onCancel}
        onSubmit={submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {gap: spacing.md},
  actions: {flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs},
  action: {flex: 1},
});
