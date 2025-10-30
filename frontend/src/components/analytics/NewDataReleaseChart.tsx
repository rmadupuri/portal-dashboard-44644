import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

const NewDataReleaseChart: React.FC = () => {
  const releaseData = {
    date: "May 06, 2025",
    totalSamples: 4571,
    totalStudies: 10,
    studies: [
      { name: "Pancreatic Adenocarcinoma (MSK, Nat Med 2024)" },
      { name: "Cerebrospinal Fluid Circulating Tumor DNA (MSK, Acta Neuropathol Commun 2024)" },
      { name: "Ovarian Cancer (Gray Foundation, Cancer Discov 2024)" },
      { name: "Normal Melanocytes (UCSF, Nature 2020)" },
      { name: "Normal Keratinocytes from human skin (UCSF, BioRxiv 2024)" }
    ]
  };

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">
          New data Release
        </CardTitle>
        <p className="text-sm text-gray-600">
          Latest data additions to cBioPortal
        </p>
      </CardHeader>

      <CardContent>
        {/* Summary badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
            Release Date: {releaseData.date}
          </span>
          <span className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
            {releaseData.totalSamples.toLocaleString()} Samples
          </span>
          <span className="bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
            {releaseData.totalStudies} Studies
          </span>
        </div>

        {/* Study list */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-semibold text-gray-800 mb-3">Recent Studies</h3>
          <ul className="list-disc list-inside text-blue-700 text-sm space-y-2">
            {releaseData.studies.map((study, index) => (
              <li key={index} className="hover:text-blue-900 cursor-pointer">
                {study.name}
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <a
              href="https://docs.cbioportal.org/news/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
            >
              See all
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewDataReleaseChart;
