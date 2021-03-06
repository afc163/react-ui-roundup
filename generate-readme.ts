import {
  append,
  chain,
  filter,
  includes,
  indexBy,
  intersperse,
  map,
  pipe,
  pluck,
  prepend,
  prop,
  reject,
  sortBy,
  update,
  values,
  whereEq,
} from 'ramda';
import { compact, concatAll } from 'ramda-adjunct';
import { componentInfo } from './components';
import { frameworks, frameworkInfo, frameworksById } from './frameworks';
import { writeFile } from 'fs';
import { lines, h1, h2, link, p, table, disclaimerLines, website, disclaimer, criteria } from './markdownUtils';
import { removeProtocol, getRepoInfo, noValue, toStablePairs, issueURL } from './utils';
import { Component, Framework } from './entities';

const pleaseFileIssue = link({
  text: 'Please file an issue',
  href: issueURL,
});

const headerMarkdown = disclaimerLines([
  h1('React UI Roundup'),
  p('Are you a frontend developer or designer?  Do you wish you had a one-stop-shop you could go to see the various implementations of common components?  If so - React UI Roundup is for you!'),
  p(`An even more better version of this exact document is available at ${website}.  It has special "Open All" buttons that allow you to open every link in a table with one click!`)
])

const frameworksSectionMarkdown = (repoInfo: any) => disclaimerLines([
  h2('Framework Statistics'),
  table({
    headers: [
      'Name',
      'Homepage',
      'Repository',
      'Stars',
      'Forks',
      'Issues',
      'License',
    ],
    rows: map(({ frameworkName, frameworkHomepage, repoURL }) => [
      frameworkName,
      link({ text: removeProtocol(frameworkHomepage), href: frameworkHomepage }),
      link({ text: removeProtocol(repoURL).replace(/github\.com\//, ''), href: repoURL }),
      repoInfo[repoURL]?.stargazers_count?.toLocaleString() ?? noValue,
      repoInfo[repoURL]?.forks_count?.toLocaleString() ?? noValue,
      repoInfo[repoURL]?.open_issues_count?.toLocaleString() ?? noValue,
      repoInfo[repoURL]?.license?.name?.replace(/ License/, '') ?? noValue,
    ], frameworks),
  }),
]);

const frameworkFeaturesSectionMarkdown = disclaimerLines([
  h2('Framework Features'),
  criteria(map(({ name, criteria }) => [name, criteria], frameworkInfo)),
  table({
    headers: [
      'Name',
      ...pluck('name', frameworkInfo),
    ],
    rows: map(({ frameworkName, frameworkFeaturesById }) => [
      frameworkName,
      ...map(({ toMarkdown, featureId }) => (
        // @ts-ignore @ROBBBBBBBBBBBBBBB
        toMarkdown(frameworkFeaturesById[featureId])
      ), frameworkInfo),
    ], frameworks),
  })
])

const frameworksMarkdown = (repoInfo: any) => disclaimerLines([
  h1('Frameworks'),
  frameworksSectionMarkdown(repoInfo),
  frameworkFeaturesSectionMarkdown,
]);

type EnhancedComponent = Component & Pick<Framework, 'frameworkName' | 'frameworkId'>;

const componentsMarkdown = disclaimerLines([
  h1('Components'),
  ...chain(({ componentId, cannonicalName, indefiniteArticle, optionsById }) => {
    const optionsArray = pipe(
      values,
      sortBy(prop('name')),
    )(optionsById);

    const headers = [
      'Framework',
      'Name',
      ...pluck('name', optionsArray),
    ];

    const enhancedComponents: EnhancedComponent[] = chain(({ components, frameworkId, frameworkName }) => (
      map(component => ({
        ...component,
        frameworkId,
        frameworkName
      }), components)
    ), frameworks);

    const rows = pipe(
      // @ts-ignore
      filter(whereEq({ componentId })),
      map(({ componentName, frameworkName, componentURL, options }) => [
        frameworkName,
        link({ text: componentName, href: componentURL }),
        // @ts-ignore @ROBBBBBBBBBBBBBBB
        ...map(({ optionId, toMarkdown }) => toMarkdown(options[optionId]), optionsArray),
      ]),
    )(enhancedComponents);

    const missingFrameworks = pipe(
      filter(whereEq({ componentId })),
      // @ts-ignore
      pluck('frameworkId'),
      (frameworkIds: string[]) => reject(
        framework => includes(framework.frameworkId, frameworkIds),
        frameworks,
      ),
      map(({ frameworkName, repoURL }) => (
        link({ text: frameworkName, href: repoURL })
      )),
      intersperse(', '),
      (elements: string[]) => {
        switch (elements.length) {
          case 0:
            return [];

          case 1:
            return elements;

          case 3:
            return update(1, ' and ', elements)

          default:
            return update(elements.length - 2, ', and ', elements);
        }
      },
      (elements: string[]) => elements.length > 0 ? append(
        ` appear${elements.length === 1 ? 's' : ''} to be missing ${indefiniteArticle} ${cannonicalName} component. ${pleaseFileIssue} if one now exists.\n`,
        elements,
      ) : [],
      elements => elements.length > 0 ? prepend('> ', elements) : [],
      concatAll,
    )(enhancedComponents)

    return [
      disclaimer,
      h2(cannonicalName),
      criteria(map(([key, value]) => (
        [value.name, value.criteria]
      ), toStablePairs(optionsById))),
      table({
        headers,
        rows,
      }),
      missingFrameworks,
    ];
  }, componentInfo),
]);

const fetchAll = async () => {
  const repoInfo = await Promise.all(
    map(({ repoURL }) => getRepoInfo(repoURL), frameworks)
  );

  const readme = lines([
    headerMarkdown,
    frameworksMarkdown(indexBy(prop('html_url'), compact(repoInfo))),
    componentsMarkdown,
  ]);

  writeFile('README.md', readme, error => {
    if (error) {
      return console.error(error);
    }
  });
};

fetchAll();
